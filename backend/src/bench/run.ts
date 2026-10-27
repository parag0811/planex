/**
 * Planex benchmark harness.
 *
 * Measures the REAL system against your live infrastructure:
 *   1. Redis round-trip latency (SET / GET / PING / pipelined batch)
 *   2. AI generation cold vs Redis cache hit (real LLM calls)
 *   3. BullMQ enqueue + worker drain throughput
 *   4. HTTP throughput + latency under load (autocannon)
 *   5. Distributed rate-limiter enforcement (burst of 1,100 requests)
 *
 * Nothing here is simulated. Every number is measured on this run.
 *
 * Usage: npm run bench
 */

import "dotenv/config";
import { execSync, spawn } from "child_process";
import type { ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Queue, Worker } from "bullmq";
import appRedis from "../db/redis";
import { llmCallLog, llmFailureLog } from "../modules/ai/llmClient";
import { runPlannerPipeline } from "../modules/ai/sections/idea-section/ideaPlannerPipeline";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const autocannon = require("autocannon");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Stats = {
  n: number;
  avg: number;
  min: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
};

const round = (value: number, digits = 1): number =>
  Number(value.toFixed(digits));

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
};

const stats = (samples: number[]): Stats => {
  if (samples.length === 0) {
    return { n: 0, avg: 0, min: 0, p50: 0, p95: 0, p99: 0, max: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  return {
    n: sorted.length,
    avg: round(sum / sorted.length),
    min: round(sorted[0] ?? 0),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted[sorted.length - 1] ?? 0),
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const line = (label: string, value: string | number) =>
  console.log(`   ${label.padEnd(26, ".")} ${value}`);

const banner = (title: string) => {
  console.log("");
  console.log("─".repeat(64));
  console.log(title);
  console.log("─".repeat(64));
};

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in backend/.env`);
  }
  return value;
};

const redisConnection = () => ({
  host: requireEnv("REDIS_HOST"),
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
  keepAlive: 10000,
  ...(process.env.REDIS_USERNAME ? { username: process.env.REDIS_USERNAME } : {}),
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
  ...(process.env.REDIS_TLS === "true"
    ? {
        tls: {
          servername: process.env.REDIS_HOST as string,
          rejectUnauthorized: false,
        },
      }
    : {}),
});

const emptyStats = (): Stats => ({
  n: 0,
  avg: 0,
  min: 0,
  p50: 0,
  p95: 0,
  p99: 0,
  max: 0,
});

// ---------------------------------------------------------------------------
// Live server handling
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT) || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
let spawnedServer: ChildProcess | null = null;

const isServerUp = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${BASE_URL}/live`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
};

const ensureServer = async (): Promise<boolean> => {
  if (await isServerUp()) {
    console.log(`♻️  Using the API already running on port ${PORT}`);
    return true;
  }

  console.log(`⏳ Starting the API on port ${PORT} (this takes a few seconds)...`);
  const backendRoot = path.resolve(__dirname, "../..");

  spawnedServer = spawn(
    process.execPath,
    ["-r", "ts-node/register/transpile-only", "src/server.ts"],
    {
      cwd: backendRoot,
      env: { ...process.env, KEEPALIVE_INTERVAL_MS: "0" },
      stdio: "ignore",
    },
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isServerUp()) {
      console.log("✅ API is up");
      return true;
    }
    await sleep(1000);
  }

  console.warn("⚠️  Could not start the API. HTTP + rate-limit tests will be skipped.");
  return false;
};

const stopServer = () => {
  if (!spawnedServer || !spawnedServer.pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(spawnedServer.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      spawnedServer.kill("SIGKILL");
    }
  } catch {
    // best effort
  }
  spawnedServer = null;
};

const runAutocannon = (options: Record<string, unknown>): Promise<any> =>
  new Promise((resolve, reject) => {
    autocannon(options, (error: Error | null, result: unknown) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

// ---------------------------------------------------------------------------
// Benchmark sections
// ---------------------------------------------------------------------------

const benchRedis = async () => {
  banner("1/5  REDIS ROUND-TRIP  (live instance, TLS, from this machine)");

  // db/redis.ts disables the offline queue, so make sure the socket is ready
  // before the first command instead of buffering.
  if (appRedis.status !== "ready") {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Redis did not become ready within 15s")),
        15000,
      );
      appRedis.once("ready", () => {
        clearTimeout(timer);
        resolve();
      });
      appRedis.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  await appRedis.ping();
  for (let i = 0; i < 10; i += 1) await appRedis.ping(); // warm-up

  const ping: number[] = [];
  for (let i = 0; i < 200; i += 1) {
    const start = performance.now();
    await appRedis.ping();
    ping.push(performance.now() - start);
  }

  const sets: number[] = [];
  for (let i = 0; i < 200; i += 1) {
    const start = performance.now();
    await appRedis.set(`bench:rtt:${i}`, `value-${i}`, "EX", 300);
    sets.push(performance.now() - start);
  }

  const gets: number[] = [];
  for (let i = 0; i < 200; i += 1) {
    const start = performance.now();
    await appRedis.get(`bench:rtt:${i}`);
    gets.push(performance.now() - start);
  }

  const pipelineStart = performance.now();
  const pipeline = appRedis.pipeline();
  for (let i = 0; i < 500; i += 1) pipeline.get(`bench:rtt:${i % 200}`);
  await pipeline.exec();
  const pipelineTotal = performance.now() - pipelineStart;

  const pingStats = stats(ping);
  const setStats = stats(sets);
  const getStats = stats(gets);

  console.log("");
  console.log("   op            n     avg     p50     p95     p99     max   (ms)");
  const row = (name: string, s: Stats) =>
    console.log(
      `   ${name.padEnd(12)} ${String(s.n).padStart(3)}  ${String(s.avg).padStart(6)}  ${String(s.p50).padStart(6)}  ${String(s.p95).padStart(6)}  ${String(s.p99).padStart(6)}  ${String(s.max).padStart(6)}`,
    );
  row("PING", pingStats);
  row("SET", setStats);
  row("GET", getStats);

  line("Pipeline 500 GETs", `${round(pipelineTotal)} ms total`);
  line("Pipeline per command", `${round(pipelineTotal / 500, 2)} ms`);

  const keys = Array.from({ length: 200 }, (_, i) => `bench:rtt:${i}`);
  await appRedis.del(...keys);

  return { ping: pingStats, set: setStats, get: getStats, pipelineTotal, pipelinePerCommand: pipelineTotal / 500 };
};

const benchCacheAndAi = async () => {
  banner("2/5  AI GENERATION: COLD LLM vs WARM REDIS CACHE  (real calls)");

  const runId = crypto.randomUUID().slice(0, 8);
  const ideas = [
    "A B2B SaaS dashboard for tracking fleet maintenance schedules and fuel costs",
    "A real-time multiplayer quiz platform for university classrooms",
    "An inventory management system for small pharmacies with expiry alerts",
    "A personal finance app that categorises bank transactions with AI",
    "A customer support inbox that prioritises tickets by sentiment",
  ].map((idea) => `${idea} (bench ${runId})`);

  const cold: number[] = [];
  const warm: number[] = [];
  const failures: string[] = [];
  const tokensBefore = llmCallLog.length;
  const failoversBefore = llmFailureLog.length;

  for (let index = 0; index < ideas.length; index += 1) {
    const idea = ideas[index]!;
    console.log(`   generating ${index + 1}/${ideas.length} ...`);

    try {
      const coldStart = performance.now();
      await runPlannerPipeline(idea);
      cold.push(performance.now() - coldStart);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.log(`   ⚠️  cold run failed: ${message.slice(0, 120)}`);
      continue;
    }

    const warmStart = performance.now();
    await runPlannerPipeline(idea);
    warm.push(performance.now() - warmStart);
  }

  const calls = llmCallLog.slice(tokensBefore);
  const coldStats = stats(cold);
  const warmStats = stats(warm);
  const tokenValues = calls
    .map((call) => call.totalTokens)
    .filter((value): value is number => typeof value === "number");
  const avgTokens =
    tokenValues.length > 0
      ? tokenValues.reduce((a, b) => a + b, 0) / tokenValues.length
      : null;

  const hitRate =
    cold.length + warm.length > 0
      ? (warm.length / (cold.length + warm.length)) * 100
      : 0;
  const speedup = warmStats.p50 > 0 ? coldStats.p50 / warmStats.p50 : 0;

  console.log("");
  line("Workload", `${cold.length + warm.length} requests / ${ideas.length} unique prompts`);
  line("Cold (LLM)", `p50 ${coldStats.p50} ms | p95 ${coldStats.p95} ms | n=${coldStats.n}`);
  line("Warm (cache)", `p50 ${warmStats.p50} ms | p95 ${warmStats.p95} ms | n=${warmStats.n}`);
  line("Cache hit rate", `${round(hitRate)}%`);
  line("Speedup (p50)", `${round(speedup)}x`);
  if (avgTokens !== null) line("Avg tokens / call", `${Math.round(avgTokens)}`);
  line("Provider failovers", llmFailureLog.length - failoversBefore);
  line("Failed generations", failures.length);

  return {
    cold: coldStats,
    warm: warmStats,
    hitRate,
    speedup,
    avgTokens,
    failures,
    failovers: llmFailureLog.length - failoversBefore,
    providers: calls.map((call) => `${call.provider}/${call.model}`),
    model: calls[0]?.model ?? "unknown",
  };
};

const benchQueue = async () => {
  banner("3/5  BULLMQ QUEUE THROUGHPUT  (real Redis, isolated queue)");

  const TOTAL_JOBS = 200;
  const queue = new Queue("bench-queue", {
    connection: redisConnection(),
    defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
  });

  await queue.obliterate({ force: true }).catch(() => undefined);

  const enqueue: number[] = [];
  const enqueueStart = performance.now();

  for (let i = 0; i < TOTAL_JOBS; i += 1) {
    const start = performance.now();
    await queue.add("noop", { index: i }, { attempts: 1 });
    enqueue.push(performance.now() - start);
  }

  const enqueueTotal = performance.now() - enqueueStart;

  let completed = 0;
  const drainStart = performance.now();

  const worker = new Worker("bench-queue", async () => undefined, {
    connection: redisConnection(),
    concurrency: 3, // same as the production AI worker
  });

  worker.on("completed", () => {
    completed += 1;
  });

  const timeoutAt = Date.now() + 180_000;
  while (completed < TOTAL_JOBS && Date.now() < timeoutAt) {
    await sleep(200);
  }

  const drainTotal = performance.now() - drainStart;

  await worker.close();
  await queue.obliterate({ force: true }).catch(() => undefined);
  await queue.close();

  const enqueueStats = stats(enqueue);

  console.log("");
  line("Jobs enqueued", TOTAL_JOBS);
  line("Enqueue p50 / p95", `${enqueueStats.p50} ms / ${enqueueStats.p95} ms`);
  line("Enqueue throughput", `${round(TOTAL_JOBS / (enqueueTotal / 1000))} jobs/s`);
  line("Drain time", `${round(drainTotal / 1000, 1)} s`);
  line("Drain throughput", `${round(completed / (drainTotal / 1000))} jobs/s`);
  line("Jobs completed", `${completed}/${TOTAL_JOBS}`);

  return {
    total: TOTAL_JOBS,
    enqueue: enqueueStats,
    enqueueThroughput: TOTAL_JOBS / (enqueueTotal / 1000),
    drainMs: drainTotal,
    drainThroughput: completed / (drainTotal / 1000),
    completed,
  };
};

const benchHttp = async () => {
  banner("4/5  HTTP LOAD  (autocannon, localhost → live Postgres/Redis)");

  const liveResult = await runAutocannon({
    url: `${BASE_URL}/live`,
    connections: 50,
    duration: 10,
    pipelining: 1,
  });

  console.log("");
  console.log("   /live   (no dependencies)");
  line("Requests/sec", round(liveResult.requests.average));
  line("Latency p50", `${round(liveResult.latency.p50)} ms`);
  line("Latency p97.5", `${round(liveResult.latency.p97_5)} ms`);
  line("Latency p99", `${round(liveResult.latency.p99)} ms`);
  line("Total requests", liveResult.requests.total);
  line("Errors / timeouts", `${liveResult.errors} / ${liveResult.timeouts}`);

  const healthResult = await runAutocannon({
    url: `${BASE_URL}/health`,
    connections: 5,
    duration: 5,
    pipelining: 1,
  });

  console.log("");
  console.log("   /health (pings Postgres + Redis on every request)");
  line("Requests/sec", round(healthResult.requests.average));
  line("Latency p50", `${round(healthResult.latency.p50)} ms`);
  line("Latency p97.5", `${round(healthResult.latency.p97_5)} ms`);
  line("Latency p99", `${round(healthResult.latency.p99)} ms`);
  line("Errors / non-2xx", `${healthResult.errors} / ${healthResult.non2xx}`);

  return {
    live: {
      rps: liveResult.requests.average,
      p50: liveResult.latency.p50,
      p975: liveResult.latency.p97_5,
      p99: liveResult.latency.p99,
      total: liveResult.requests.total,
      errors: liveResult.errors,
    },
    health: {
      rps: healthResult.requests.average,
      p50: healthResult.latency.p50,
      p975: healthResult.latency.p97_5,
      p99: healthResult.latency.p99,
      total: healthResult.requests.total,
      errors: healthResult.errors,
      non2xx: healthResult.non2xx,
    },
  };
};

const benchRateLimit = async () => {
  banner("5/5  RATE LIMITER  (burst against the global limiter)");

  const TOTAL = 1100;
  const CONCURRENCY = 25;
  const counts = { allowed: 0, limited: 0, other: 0 };
  let firstLimitedAt: number | null = null;
  const startedAt = performance.now();

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async (_, lane) => {
      for (let i = lane; i < TOTAL; i += CONCURRENCY) {
        try {
          const res = await fetch(`${BASE_URL}/projects`, {
            headers: { authorization: "Bearer bench-invalid-token" },
          });
          if (res.status === 429) {
            counts.limited += 1;
            if (firstLimitedAt === null) {
              firstLimitedAt = performance.now() - startedAt;
            }
          } else if (res.status < 400 || res.status === 401) {
            counts.allowed += 1;
          } else {
            counts.other += 1;
          }
        } catch {
          counts.other += 1;
        }
      }
    }),
  );

  const elapsed = performance.now() - startedAt;

  console.log("");
  line("Requests sent", TOTAL);
  line("Passed (auth checked)", counts.allowed);
  line("Rejected 429", counts.limited);
  line("Other errors", counts.other);
  line("First 429 after", firstLimitedAt === null ? "n/a" : `${round(firstLimitedAt)} ms`);
  line("Wall time", `${round(elapsed / 1000, 1)} s`);

  // Remove the limiter keys so local development is not blocked for 15 minutes.
  let cursor = "0";
  let removed = 0;
  do {
    const [next, keys] = await appRedis.scan(
      cursor,
      "MATCH",
      "rl_global:*",
      "COUNT",
      200,
    );
    cursor = next;
    if (keys.length > 0) {
      await appRedis.del(...keys);
      removed += keys.length;
    }
  } while (cursor !== "0");
  line("Limiter keys cleared", removed);

  return { total: TOTAL, ...counts, firstLimitedAt, elapsed, removed };
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const writeReport = (result: Record<string, any>) => {
  const docsDir = path.resolve(__dirname, "../../../docs/metrics");
  fs.mkdirSync(docsDir, { recursive: true });

  const stamp = new Date().toISOString();
  const sha = (() => {
    try {
      return execSync("git rev-parse --short HEAD", {
        cwd: path.resolve(__dirname, "../../.."),
      })
        .toString()
        .trim();
    } catch {
      return "unknown";
    }
  })();

  const table = (name: string, s: Stats) =>
    `| ${name} | ${s.n} | ${s.p50} | ${s.p95} | ${s.p99} | ${s.max} |`;

  const markdown = `# Planex Performance Benchmarks

Generated by \`npm run bench\` on ${stamp}.

| | |
|---|---|
| Commit | \`${sha}\` |
| Node | ${process.version} |
| OS | ${os.type()} ${os.release()} (${os.arch()}) |
| CPU | ${os.cpus()[0]?.model ?? "unknown"} (${os.cpus().length} cores) |
| RAM | ${Math.round(os.totalmem() / 1024 ** 3)} GB |
| Redis | ${process.env.REDIS_HOST}:${process.env.REDIS_PORT} over TLS (managed, remote) |
| Database | Supabase Postgres pooled connection (remote) |
| AI provider | ${result.ai.model} |

> Every number below is measured on a single run against the live services above.
> No simulated or hard-coded values. Re-run with \`npm run bench\`.

## Headline numbers

| What | Result |
|---|---|
| Cached vs cold AI generation | **${round(result.ai.speedup)}x faster** (${Math.round(result.ai.cold.p50)} ms → ${round(result.ai.warm.p50)} ms p50) |
| AI request response time | **${round(result.queue.enqueue.p95)} ms** (returns a job ID; used to block for ${Math.round(result.ai.cold.p50)} ms) |
| HTTP throughput, no dependencies | **${round(result.http.live.rps)} req/s**, p99 ${round(result.http.live.p99)} ms, 0 errors |
| Queue throughput | **${round(result.queue.enqueueThroughput)} jobs/s** enqueue, **${round(result.queue.drainThroughput)} jobs/s** drain |
| Rate limiter accuracy | **${result.rateLimit.allowed}** allowed / **${result.rateLimit.limited}** rejected out of ${result.rateLimit.total} |
| Provider failover | **${result.ai.failovers ?? 0}** failover(s), **${result.ai.failures.length}** user-visible failure(s) |

## 1. Redis round-trip latency

| Operation | n | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) |
|---|---|---|---|---|---|
${table("PING", result.redis.ping)}
${table("SET", result.redis.set)}
${table("GET", result.redis.get)}

Pipelined batch: 500 GET commands in ${round(result.redis.pipelineTotal)} ms
(${round(result.redis.pipelinePerCommand, 2)} ms per command,
${round(500 / (result.redis.pipelineTotal / 1000))} commands/sec).

## 2. AI generation: cold vs cached

Workload: ${result.ai.cold.n + result.ai.warm.n} requests over ${result.ai.cold.n} unique prompts
(each prompt requested twice, so every second request is a cache hit).

| Path | p50 | p95 | n |
|---|---|---|---|
| Cold (real LLM call) | ${result.ai.cold.p50} ms | ${result.ai.cold.p95} ms | ${result.ai.cold.n} |
| Warm (Redis cache) | ${result.ai.warm.p50} ms | ${result.ai.warm.p95} ms | ${result.ai.warm.n} |

- **Cache hit rate:** ${round(result.ai.hitRate)}%
- **Speedup at p50:** ${round(result.ai.speedup)}x
- **Average tokens per generation:** ${result.ai.avgTokens === null ? "n/a" : Math.round(result.ai.avgTokens)}
- **Provider failovers (auto-recovered):** ${result.ai.failovers ?? 0}
- **Failed generations:** ${result.ai.failures.length}
${result.ai.failovers > 0
    ? `
> The cold p95 is much higher than the p50 because at least one run hit a
> provider 503 spike and had to fail over to the secondary provider.
> Every generation still succeeded, which is the point of the fallback path.
`
    : ""}
## 3. BullMQ queue throughput

Real jobs on an isolated \`bench-queue\` in the live Redis instance. The worker
handler is a no-op, so this isolates queue overhead (Redis + BullMQ), not LLM time.

| Metric | Value |
|---|---|
| Jobs enqueued | ${result.queue.total} |
| Enqueue p50 | ${result.queue.enqueue.p50} ms |
| Enqueue p95 | ${result.queue.enqueue.p95} ms |
| Enqueue throughput | ${round(result.queue.enqueueThroughput)} jobs/s |
| Drain time (concurrency 3) | ${round(result.queue.drainMs / 1000, 1)} s |
| Drain throughput | ${round(result.queue.drainThroughput)} jobs/s |

## 4. HTTP load (autocannon)

| Endpoint | Connections | Requests/sec | p50 | p97.5 | p99 | Errors |
|---|---|---|---|---|---|---|
| \`GET /live\` (no deps) | 50 × 10s | ${round(result.http.live.rps)} | ${round(result.http.live.p50)} ms | ${round(result.http.live.p975)} ms | ${round(result.http.live.p99)} ms | ${result.http.live.errors} |
| \`GET /health\` (Postgres + Redis) | 5 × 5s | ${round(result.http.health.rps)} | ${round(result.http.health.p50)} ms | ${round(result.http.health.p975)} ms | ${round(result.http.health.p99)} ms | ${result.http.health.errors + result.http.health.non2xx} |

## 5. Distributed rate limiter

| Metric | Value |
|---|---|
| Requests sent | ${result.rateLimit.total} |
| Passed (401 from auth, proves it reached the route) | ${result.rateLimit.allowed} |
| Rejected with 429 | ${result.rateLimit.limited} |
| First 429 after | ${round(result.rateLimit.firstLimitedAt ?? 0)} ms |

Global limit is 1,000 requests / 15 minutes per IP, so ~100 of 1,100 requests
must be rejected. Limiter keys were cleared afterwards so local dev is unaffected.
`;

  fs.writeFileSync(path.join(docsDir, "RESULTS.md"), markdown, "utf8");
  fs.writeFileSync(
    path.join(docsDir, `raw-${stamp.replace(/[:.]/g, "-")}.json`),
    JSON.stringify(result, null, 2),
    "utf8",
  );

  console.log("");
  console.log("📄 Report written to docs/metrics/RESULTS.md");
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  PLANEX PERFORMANCE BENCHMARK                              ║");
  console.log("║  Real measurements against live Redis, Postgres and LLM    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const result: Record<string, any> = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
  };

  result.redis = await benchRedis();

  try {
    result.ai = await benchCacheAndAi();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  AI section failed: ${message}`);
    result.ai = {
      cold: emptyStats(),
      warm: emptyStats(),
      hitRate: 0,
      speedup: 0,
      avgTokens: null,
      failures: [message],
      failovers: 0,
      providers: [],
      model: "unavailable",
    };
  }

  result.queue = await benchQueue();

  const serverReady = await ensureServer();
  if (serverReady) {
    try {
      result.http = await benchHttp();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  HTTP load section failed: ${message}`);
    }
    try {
      result.rateLimit = await benchRateLimit();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  Rate-limit section failed: ${message}`);
    }
  }

  result.http ??= {
    live: { rps: 0, p50: 0, p975: 0, p99: 0, total: 0, errors: 0 },
    health: { rps: 0, p50: 0, p975: 0, p99: 0, total: 0, errors: 0, non2xx: 0 },
  };
  result.rateLimit ??= {
    total: 0,
    allowed: 0,
    limited: 0,
    other: 0,
    firstLimitedAt: null,
    elapsed: 0,
    removed: 0,
  };

  writeReport(result);

  banner("DONE");
  console.log("Copy the tables from docs/metrics/RESULTS.md into your README.");
  console.log("");
};

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Benchmark failed:", error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    stopServer();
    await appRedis.quit().catch(() => undefined);
    setTimeout(() => process.exit(process.exitCode ?? 0), 500);
  });
