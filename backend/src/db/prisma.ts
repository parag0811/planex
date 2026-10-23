import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Set it to a valid PostgreSQL connection string before starting the server.",
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "DATABASE_URL is not a valid connection URL. Expected a postgresql:// connection string.",
    );
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(
      `DATABASE_URL uses unsupported protocol "${parsed.protocol}". Expected postgresql:// or postgres://.`,
    );
  }

  return url;
};

const databaseUrl = getDatabaseUrl();

// If the URL already includes sslmode, pg handles TLS itself. Otherwise use
// TLS for every non-local database and leave local/container databases
// unencrypted. Set DATABASE_SSL=false only for a remote DB without TLS.
const databaseUrlHasSslMode = /[?&]sslmode=/i.test(databaseUrl);
const databaseHostIsLocal =
  /(^|@)(localhost|127\.0\.0\.1|\[::1\]|postgres|db|database|host\.docker\.internal)(:|\/|$)/i.test(
    databaseUrl,
  );
const databaseSslOverride = process.env.DATABASE_SSL?.toLowerCase();
const sslEnabled =
  databaseSslOverride === "true" ||
  (databaseSslOverride !== "false" &&
    !databaseHostIsLocal &&
    !databaseUrlHasSslMode);

const adapter = new PrismaPg({
  connectionString: databaseUrl,
  max: parsePositiveInt(process.env.DATABASE_POOL_MAX, 10),
  connectionTimeoutMillis: parsePositiveInt(
    process.env.DATABASE_CONNECT_TIMEOUT_MS,
    10000,
  ),
  idleTimeoutMillis: parsePositiveInt(
    process.env.DATABASE_IDLE_TIMEOUT_MS,
    30000,
  ),
  ...(sslEnabled
    ? {
        ssl: {
          // Equivalent to sslmode=require. Set
          // DATABASE_SSL_REJECT_UNAUTHORIZED=true only when the provider's
          // CA chain is trusted by the runtime (many poolers are not).
          rejectUnauthorized:
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
        },
      }
    : {}),
});

// pg → the standard Node.js PostgreSQL driver library
// @prisma/adapter-pg → wraps pg so Prisma can use it
// Prisma → uses the adapter to query your Supabase database

const prisma = new PrismaClient({
  adapter,
  log: ["query"],
});

export default prisma;
