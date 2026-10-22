# Planex Production Bug Audit and Phased Fix Plan

**Created:** 2026-10-22
**Scope:** Backend (Express / Prisma / Redis / BullMQ / Passport) and Frontend (Next.js / Redux / Axios)
**Status:** Audit complete. No code changes have been made yet.
**Purpose:** Fix production issues in three controlled phases, highest priority first, without introducing regressions.

**Reprioritization (2026-10-22):** Authentication is now **Phase 1**. Recruiters may use the production app, and social login currently fails with a raw JSON 500. The audit was verified against the live production backend at `https://planex-c7tm.onrender.com`.

---

## 1. Priority and Phase Legend

| Label | Meaning |
| --- | --- |
| **P0** | Production-breaking: data breach, data loss, total outage, or login unavailable. Fix first. |
| **P1** | High impact: intermittent failures, broken core flow, or serious operational risk. |
| **P2** | Medium impact: hardening, observability, edge cases, and UX polish. |

| Phase | Theme | Target Window |
| --- | --- | --- |
| **Phase 1** | Authentication, sessions, OAuth, and access-control recovery | Days 1-4 |
| **Phase 2** | Availability, database, and data integrity | Days 5-6 |
| **Phase 3** | Reliability, frontend resilience, and hardening | Days 7-9 |

**Rule:** Ship and verify one phase at a time. Do not mix a risky infrastructure change and a schema migration in the same deploy.

---

## 2. Issue Summary

| ID | Priority | Phase | Issue | Area |
| --- | --- | --- | --- | --- |
| BUG-01 | P0 | 1 | Any authenticated user can read or rename any project (IDOR) | Backend authorization |
| BUG-02 | P0 | 1 | Password hashes, provider IDs, and invite tokens exposed in project responses | Backend API |
| BUG-03 | P0 | 1 | Any authenticated user can read any job result and job payload (IDOR) | Backend jobs |
| BUG-04 | P0 | 1 | Project owner can change another project's member role (IDOR) | Backend members |
| BUG-05 | P0 | 1-2 | Redis failure hangs requests or turns every guarded route into a 500 | Infrastructure |
| BUG-06 | P0 | 2 | Database connections have no timeout and SSL is not explicit | Infrastructure |
| BUG-07 | P0 | 2 | Production migrations are not run during deploy | Deployment |
| BUG-08 | P1 | 1 | CORS allow-list accepts any `*.vercel.app` and any origin containing `localhost` | Backend security |
| BUG-09 | P0 | 1 | Users are forced to log in again after leaving the site | Auth / session |
| BUG-10 | P0 | 1 | Google/GitHub login intermittently fails or creates duplicate accounts | Auth / OAuth |
| BUG-11 | P1 | 1 | OAuth has no `state` protection and the JWT is exposed in the callback URL | Auth security |
| BUG-12 | P1 | 2 | Deleting a shared project fails because member rows block the delete | Database schema |
| BUG-13 | P1 | 1 | Optional Supabase env vars can crash the backend at startup | Backend startup |
| BUG-14 | P1 | 2 | Chat AI endpoint has no dedicated rate limit or input bound | Backend API |
| BUG-15 | P0 | 3 | AI jobs are marked failed after every retry attempt, not only the final one | BullMQ worker |
| BUG-16 | P1 | 3 | Global rate limit is too low for job polling and causes false failures | Rate limiting |
| BUG-17 | P1 | 3 | Likely production build failure: `useSearchParams` without Suspense | Frontend build |
| BUG-18 | P1 | 3 | Job polling has no maximum duration or terminal timeout | Frontend jobs |
| BUG-19 | P1 | 1 | Login flow loses the real error and clears the token on non-401 failures | Frontend auth |
| BUG-20 | P2 | 3 | Prisma query logging is always enabled | Backend performance |
| BUG-21 | P2 | 3 | Job ID collisions and orphaned AI calls after timeout | Backend jobs |
| BUG-22 | P1 | 1 | Health endpoint reports healthy while DB/Redis are unavailable | Operations |
| BUG-23 | P2 | 2 | Rate-limiter IPv6 key handling is incomplete | Backend security |
| BUG-24 | P0 | 1 | Production rate limiter returns 500 for every route after `globalLimiter` | Backend availability |
| BUG-25 | P0 | 1 | Social login initiation shows a raw JSON 500 instead of a usable error page | Auth / UX |

---

## 3. Detailed Findings

### BUG-01 - Project access control is missing (P0)

**Files:**
- `backend/src/middleware/project-middleware/projectAccess.ts:26-31`
- `backend/src/modules/project/project.route.ts:32,42-49`

**Root cause:**
`projectAccess` loads the project and membership but never rejects the request when the user is neither the owner nor a member. It always calls `next()`.

**Impact:**
Any authenticated user who knows or guesses a project UUID can:
- read the project, its members, and its invite link via `GET /projects/:projectId`
- rename the project via `PUT /projects/:projectId/update-project`

**Fix:**
- If `project.owner_id === userId` or a membership exists, continue.
- Otherwise return 404 (not 403) to avoid confirming that the project exists.
- Keep `ownerAccess` and `editorAccess` as additional checks.

**Verification:**
Create two users and two projects. User A must receive 404 for User B's project on both endpoints.

---

### BUG-02 - Sensitive user and project fields are exposed (P0)

**Files:**
- `backend/src/modules/project/project.controller.ts:48-55`
- `backend/src/modules/project/project.controller.ts:74-85`

**Root cause:**
`getProjects` includes `owner: true`, and `getProjectById` includes `members.user: true`. Prisma returns every column, including `password`, `provider`, and `providerId`. Project objects also include `inviteToken` and `inviteTokenExpiry`.

**Impact:**
- Password hashes are sent to every project member.
- Provider identity fields are leaked.
- Invite tokens are exposed to every member, not only the owner.
- Violates least-privilege data exposure.

**Fix:**
Use explicit `select` for owner and members:
- `id`, `name`, `email`, `avatarUrl` only.
- Remove `inviteToken`/`inviteTokenExpiry` from general project responses.
- Return the derived `inviteLink` only to the owner.

**Verification:**
Inspect API responses and confirm no `password`, `providerId`, `inviteToken`, or `inviteTokenExpiry` fields are present.

---

### BUG-03 - Job status endpoint leaks other users' jobs (P0)

**Files:**
- `backend/src/modules/jobs/jobs.route.ts:7`
- `backend/src/modules/jobs/jobs.controller.ts:65-71`
- `backend/src/modules/project-ai-chat/chatController.ts:26-45`

**Root cause:**
`GET /jobs/:jobId` requires only `isAuth`. It has no ownership or project check and returns `result`, `jobData`, `jobName`, and raw errors.

Chat jobs do not set a custom job ID, so BullMQ generates sequential numeric IDs. These are trivial to enumerate.

**Impact:**
An authenticated attacker can enumerate `/jobs/1`, `/jobs/2`, and so on to read:
- other users' prompts and chat messages
- generated architecture, database schemas, API designs
- project IDs and internal job data

**Fix:**
- Add `userId` and `projectId` to every job state written to Redis.
- In `jobStatus`, compare job owner with `req.user.id`; return 404 on mismatch.
- Alternatively expose jobs under `/projects/:projectId/jobs/:jobId` with `projectAccess` and `memberAccess`.
- Add the same check to retry.
- Consider non-sequential job IDs for chat jobs.

**Verification:**
Create jobs for two users. User A must receive 404 for User B's job ID.

---

### BUG-04 - Member role update is not scoped to the project (P0)

**File:** `backend/src/modules/project-member/project.member.controller.ts:27-51`

**Root cause:**
`updateProjectMemberRole` updates by primary key `id` only. The `projectId` from the URL is ignored after middleware.

**Impact:**
A project owner can change a member row belonging to another project if the member UUID is known. Member UUIDs are already exposed by BUG-02.

**Fix:**
- Update using a `where` that includes both `id` and `project_id`, or verify the fetched member's `project_id` first.
- Return 404 when the member is not part of the URL project.

**Verification:**
Attempt to update a member from project B using project A's URL. Expect 404 and no database change.

---

### BUG-05 - Redis failure hangs or 500s the entire backend (P0)

**Files:**
- `backend/src/db/redis.ts:3-21`
- `backend/src/middleware/rateLimit.middleware.ts:17-29`
- `backend/src/modules/ai/sections/idea-section/ideaPlannerPipeline.ts:36-52,77-84`
- `backend/src/modules/ai/sections/db-section/dbPlannerPipeline.ts:42-58,86-93`
- Same Redis cache pattern in API and folder pipelines.

**Root cause:**
The shared ioredis client uses `maxRetriesPerRequest: null` and the default offline queue. When Redis is unreachable, commands can be buffered instead of rejecting quickly. The `try/catch` fail-open logic then never executes.

A second, confirmed failure mode is worse: `createStore()` in `rateLimit.middleware.ts` returns the number `1` when a Redis command fails. `rate-limit-redis` v5 expects `SCRIPT LOAD` to return a string SHA and `EVALSHA` to return a two-element array. Returning `1` makes the store throw `TypeError: unexpected reply from redis client` or `TypeError: Expected result to be array of values`. Because `express-rate-limit` has `passOnStoreError: false`, that TypeError is forwarded to the error handler and becomes an HTTP 500.

**Confirmed production symptom (2026-10-22):**
The live backend at `https://planex-c7tm.onrender.com` returns:
- `200` for `/` and `/health`
- `500` with `{"status":500,"message":"An internal server error occurred. Please try again shortly."}` for `/auth/google`, `/auth/github`, `/auth/login`, `/auth/register`, `/projects`, and even unknown routes

This means the failure is in `globalLimiter`, which runs before every guarded route, not in Passport or the OAuth providers. `/auth/google/callback` without a code still redirects to the frontend because callback errors take the HTML redirect path in `error.middleware.ts`.

**Impact:**
- Every login path, including Google/GitHub, appears broken.
- Every API request after `globalLimiter` returns 500.
- AI generation cannot be started.
- `/health` still reports healthy, masking the outage.
- Depending on how Redis fails, requests may either hang or fail immediately with 500. Both modes are production outages.

**Fix:**
- **Emergency (Phase 1):**
  - Remove the fake `return 1` fallback. Either return the real Redis reply or let `passOnStoreError: true` fail open.
  - Configure each limiter with `passOnStoreError: true` so a Redis problem does not fail every request.
  - Use `ipKeyGenerator(req.ip)` for IP-based limiters.
  - Check the Render environment and logs for `Redis Error`, `⚠️ [RateLimit Redis Warning]`, and `unexpected reply from redis client`.
- **Full hardening (Phase 2):**
  - Use a bounded application client for rate limiting and caching:
    - `maxRetriesPerRequest: 2` or a low number
    - `enableOfflineQueue: false`
    - `connectTimeout` and `commandTimeout`
  - Keep `maxRetriesPerRequest: null` only on BullMQ queue/worker connections, where it is required.
  - Alternatively create a dedicated Redis client for rate limiting and cache operations.
  - Wrap all cache reads/writes in a helper that enforces a short timeout and treats Redis as optional.

**Verification:**
- Production `GET /projects` without a token returns 401, not 500.
- Production `POST /auth/login` with a bad password returns 401, not 500.
- Production `GET /auth/google` and `GET /auth/github` redirect to the provider, not JSON.
- Stop Redis locally and confirm API requests still return within a few seconds.
- Login still works (or returns a clear 503, not a hang).
- AI generation either works from DB fallback or fails clearly.
- `/health` reports degraded.

---

### BUG-06 - Database connections have no timeout and SSL is ambiguous (P0)

**Files:**
- `backend/src/db/prisma.ts:5`
- `backend/.env.example`
- Production `DATABASE_URL`

**Root cause:**
The `PrismaPg` adapter is created with only `connectionString`. `pg` defaults `connectionTimeoutMillis` to 0, which means wait forever. The production URL does not include explicit `sslmode` or `connect_timeout`.

**Impact:**
When Supabase is paused, cold-starting, or unreachable, requests can hang for minutes instead of promptly returning the existing 503 "warming up" response.

**Fix:**
- Pass adapter options:
  - `connectionTimeoutMillis: 10000`
  - `idleTimeoutMillis: 30000`
  - `max` sized for the Supabase plan
  - explicit SSL settings
- Add `?sslmode=require&connect_timeout=10` to the production `DATABASE_URL`.
- Validate the connection string at startup and fail with a clear message if invalid.

**Verification:**
Point the app at an unreachable database host. Confirm requests fail within roughly 10 seconds with a 503, not a hang.

---

### BUG-07 - Production migrations are not part of deploy (P0)

**Files:**
- `backend/package.json`
- `backend/Dockerfile`
- `docker-compose.yml`

**Root cause:**
The build runs `prisma generate` and `tsc`, but never `prisma migrate deploy`. A fresh production database has no tables. Docker Compose also never applies migrations.

**Impact:**
A new environment or reset database produces Prisma errors on every query. This looks like a database outage to users.

**Fix:**
- Add a deploy step that runs `npx prisma migrate deploy` before starting the server.
- Prefer a one-off release command on the host rather than running migrations from every replica.
- Document the migration command in the deployment instructions.
- Back up the database before the first production migration.

**Verification:**
Deploy against an empty database. All four section tables, user tables, and enums must exist before the first request.

---

### BUG-08 - CORS allow-list is too permissive (P1)

**File:** `backend/src/server.ts:20-54`

**Root cause:**
The origin check accepts:
- any origin ending in `.vercel.app`
- any origin containing the string `localhost`

**Impact:**
Any Vercel-hosted site or domain such as `https://evil-localhost.com` can call the API from a browser. This weakens origin isolation even though authentication uses a Bearer token rather than cookies.

**Fix:**
- Parse `FRONTEND_URL` into an exact allow-list.
- In development only, allow `http://localhost:3000` and `http://localhost:5173`.
- Remove suffix and substring matching.
- Consider rejecting `Origin: null` in production.

**Verification:**
Send requests with allowed and disallowed `Origin` headers. Only exact matches should receive CORS approval.

---

### BUG-09 - Users must log in again after leaving the site (P0)

**Files:**
- `backend/src/modules/auth/auth.controller.ts:97-103,216-218,249-251`
- `frontend/src/lib/axios.ts:13-44`
- `frontend/src/provider/AuthProvider.tsx:15-23`
- `frontend/src/store/slices/authSlice.ts:29-58,198-211`

**Current behavior:**
JWT access tokens are issued with `expiresIn: "1d"` and stored in `localStorage`. There is no refresh token and no silent renewal.

**Most likely causes, in order:**
1. **Hard one-day expiry.** Any return visit after 24 hours requires login. This is the expected behavior of the current code and the most likely cause.
2. **Any 401 response triggers a global logout.** The Axios interceptor removes the token and redirects to `/login` for every 401 outside login/register. A single stale or invalid token invalidates the whole session.
3. **`JWT_SECRET` may not be stable across deploys.** If the host regenerates the secret, every existing token becomes invalid. It must be a fixed environment variable.
4. **Frontend origin inconsistency.** Tokens in `localStorage` are per-origin. Switching between `www`, apex, a preview URL, or a custom domain silently looks like a logout.
5. **No request timeout during backend cold starts.** A sleeping backend can make `/auth/me` hang or fail, which can degrade the session experience.

**Recommended fix:**
- Short term: extend access-token lifetime to 7 days only if the product accepts the risk, and keep the secret static.
- Proper fix: access token + refresh token:
  - short-lived access token (15-60 minutes)
  - long-lived refresh token (30-90 days) stored in an `httpOnly`, `Secure`, `SameSite` cookie, or rotated refresh token in storage
  - `POST /auth/refresh` endpoint with rotation and revocation
- Change the Axios interceptor:
  - only clear the session on a 401 from an authenticated request
  - never clear on network errors, 5xx, 429, or 503
  - attempt one refresh before redirecting
  - avoid redirect loops on `/login`, `/register`, and `/oauth-callback`
- Set an Axios timeout and retry idempotent GETs once on network failure.
- Add logout reasons in development logs to distinguish expiry, invalid signature, and missing token.

**Verification:**
- Close and reopen the browser after the token lifetime.
- Restart/redeploy the backend and confirm users stay logged in.
- Simulate a 503 from `/auth/me` and confirm the user is not logged out.
- Confirm the same origin is used consistently.

**Open decision:** refresh token in an `httpOnly` cookie (safer) versus long-lived localStorage JWT (simpler, less secure).

---

### BUG-10 - OAuth login reliability and duplicate accounts (P0)

**Files:**
- `backend/src/modules/auth/passport-auth/googleStrategy.ts:28-63`
- `backend/src/modules/auth/passport-auth/githubStrategy.ts:33-71`
- `backend/src/modules/auth/auth.route.ts:28-55`

**Root causes:**
1. Local registration applies `normalizeEmail()` (for example, Gmail dots are removed), but OAuth strategies compare the raw provider email. A user who registered as `john.doe@gmail.com` is stored as `johndoe@gmail.com`; Google then returns `john.doe@gmail.com` and the app creates a second account.
2. Existing local accounts always receive a 409 error instead of being linkable. To the user, this looks like "Google login is broken".
3. OAuth also depends on Redis and the database during the callback. BUG-05 and BUG-06 therefore make social login fail or hang.
4. The callback URL is a relative path. It works behind a single trusted proxy, but it depends on correct `X-Forwarded-Host` and `X-Forwarded-Proto` headers. A proxy configuration change breaks login.

**Production status (2026-10-22):**
Social login currently fails before reaching Google or GitHub. Both `/auth/google` and `/auth/github` return the same JSON 500 as every other guarded route. The immediate cause is BUG-24 (rate-limiter store failure), not provider credentials. The duplicate-account and email-normalization issues below remain real and must be fixed after the outage is restored.

**Impact:**
Intermittent Google/GitHub login failures, duplicate accounts, and users losing access to projects tied to the original account.

**Fix:**
- Normalize provider emails the same way as local registration: trim, lowercase, and apply the same Gmail-dot policy.
- Decide on an account-linking policy (see open decisions).
- Use explicit absolute callback URLs from environment variables in production, for example `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL`.
- Improve error messages so DB outages, provider outages, and account conflicts are distinguishable.
- Log the OAuth failure reason server-side without leaking tokens.

**Verification:**
- Register locally with a dotted Gmail address, then log in with Google using the same address.
- Test a local account and a GitHub account with the same email.
- Test with the database paused and confirm a clear error rather than a hang.

**Open decision:** automatically link social login to an existing password account with the same verified email, or keep rejecting with 409 and show a clear "sign in with your password" message.

---

### BUG-11 - OAuth CSRF and token exposure (P1)

**Files:**
- `backend/src/modules/auth/auth.route.ts:72-107`
- `backend/src/modules/auth/auth.controller.ts:220-227,253-261`

**Root causes:**
- No OAuth `state` parameter is used, so login CSRF is possible.
- The JWT is placed in the callback URL query string, where it can leak through browser history, referrers, proxy logs, and analytics.

**Fix:**
- Add a cryptographically random `state` value, store it in a short-lived `httpOnly` cookie, and validate it on callback.
- Replace the JWT query parameter with a one-time, short-lived authorization code exchanged by the frontend.
- If a query token is kept temporarily, place it in the URL fragment and remove it from history immediately.

**Verification:**
- Reject callbacks with a missing or mismatched `state`.
- Confirm no JWT appears in server access logs or the referrer after redirect.

---

### BUG-12 - Shared project deletion fails (P1)

**Files:**
- `backend/prisma/schema.prisma:37-48`
- `backend/prisma/migrations/20260701123226_init_planex/migration.sql`

**Root cause:**
`ProjectMember.project` has no `onDelete: Cascade`. The generated foreign key uses the default restrict behavior. `ProjectSection` and `ProjectActivity` do cascade.

**Impact:**
`DELETE /projects/:projectId/delete-project` fails with a foreign-key error whenever the project has invited members. The global error handler currently reports this as a 503 database warning, which is misleading.

**Fix:**
- Add `onDelete: Cascade` to `ProjectMember.project`.
- Generate and review a migration before applying it.
- Consider `onDelete: SetNull` for `ProjectMember.user` if user deletion is ever added.
- Optionally, delete members in a transaction before deleting the project as a temporary mitigation.

**Verification:**
Delete a project with one editor and one viewer. Expect success and no orphan rows.

---

### BUG-13 - Optional Supabase configuration can crash startup (P1)

**Files:**
- `backend/src/utils/supabase.ts:3-6`
- `backend/src/modules/auth/auth.controller.ts:6`

**Root cause:**
The Supabase client is created at module load. `@supabase/supabase-js` throws when the URL is missing. Because `auth.controller` imports this module, a deployment without optional Supabase variables crashes before serving any request.

**Fix:**
- Lazily create the client inside the avatar-upload path.
- Throw a clear 503 only when an avatar upload is attempted without configuration.
- Validate required environment variables at startup and log a readable list.

**Verification:**
Start the backend with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` empty. The server must start and login must work; only avatar upload may fail.

---

### BUG-14 - Chat endpoint is unrestricted (P1)

**Files:**
- `backend/src/modules/project-ai-chat/chatRoute.ts:9-15`
- `backend/src/modules/project-ai-chat/chatController.ts:17-24`

**Root cause:**
The chat route has `isAuth`, `projectAccess`, and `editorAccess`, but no `aiLimiter`. The controller checks only that the message is non-empty.

**Impact:**
A single authenticated user can submit unlimited AI requests, consuming provider quota and increasing cost. Very large messages can also waste tokens.

**Fix:**
- Add `aiLimiter` to the chat route.
- Enforce a reasonable message length and context size.
- Consider a per-project queue concurrency limit.

**Verification:**
Send more than the allowed number of chat messages in one minute. Expect 429.

---

### BUG-15 - Failed AI attempts are reported as final failures (P0)

**Files:**
- `backend/src/modules/queues/aiQueue.ts:4-12`
- `backend/src/modules/queues/aiWorker.ts:134-161`

**Root cause:**
`attempts: 3` is configured, but the worker's `failed` event writes `status: "failed"` to Redis after every failed attempt. The frontend stops polling as soon as it sees `failed`.

**Impact:**
A transient provider 429/503 on attempt 1 marks the job failed in the UI. The worker may succeed on attempt 2 or 3, but the user never sees the result and may re-run generation unnecessarily.

**Fix:**
- In the `failed` handler, check the remaining attempts:
  - `job.attemptsMade >= (job.opts.attempts ?? 1)` for the final failure
  - otherwise write `pending` with a "retrying" flag, or leave the existing state
- Add `retrying` to job status if the UI should display it.
- Sanitize the final error only.

**Verification:**
Force the first AI call to fail and the second to succeed. The UI must remain pending and then show the successful result.

---

### BUG-16 - Global rate limit conflicts with polling (P1)

**Files:**
- `backend/src/middleware/rateLimit.middleware.ts:51-67`
- `frontend/src/app/(dashboard)/projects/[projectId]/idea/page.tsx:466-484`
- `frontend/src/app/(dashboard)/projects/[projectId]/api/page.tsx:652-657`
- `frontend/src/app/(dashboard)/projects/[projectId]/database/page.tsx:626-637`
- `frontend/src/app/(dashboard)/projects/[projectId]/folder/page.tsx:643-651`
- `frontend/src/components/layout/project-section/AIRightSidebar.tsx:155-177`

**Root cause:**
The global limit is 1000 requests per 15 minutes per IP. Each open tab polls a job every 2.5 seconds, about 360 requests per 15 minutes. Chat polls every 2 seconds. Three tabs, or two tabs plus chat, exceed the limit.

A rejected status poll marks the job `failed` in Redux (`jobSlice.ts:460-477`).

**Impact:**
Intermittent 429 errors and false "generation failed" states, especially for users with multiple tabs or shared IPs.

**Fix:**
- Exclude `GET /jobs/:jobId` from the global limiter, or use a separate, higher limit.
- Key limits by authenticated user ID instead of IP.
- Raise the global limit and reduce polling frequency with backoff.
- Do not mark a job failed on a network or 429 error; retry the poll.

**Verification:**
Open three tabs, start generation in each, and confirm no 429 or false failure.

---

### BUG-17 - OAuth callback page may break the production build (P1)

**Files:**
- `frontend/src/app/(auth)/oauth-callback/page.tsx:12-14`
- `frontend/src/app/(auth)/login/page.tsx:15-17`

**Root cause:**
`useSearchParams()` is called in a client page without a Suspense boundary. Next.js requires a Suspense boundary for this hook during static generation. The login page already follows the correct pattern.

**Impact:**
`next build` can fail with a missing-suspense error, blocking deployment.

**Note:** The local `.next` directory contains only dev artifacts, so this has not been confirmed with a production build.

**Fix:**
- Extract the component that uses `useSearchParams` and wrap it in `<Suspense>`.
- Run `npm run build` in `frontend` to confirm.

**Verification:**
`frontend` production build succeeds and `/oauth-callback` renders.

---

### BUG-18 - Job polling can run forever (P1)

**Files:**
- `frontend/src/app/(dashboard)/projects/[projectId]/idea/page.tsx:466-484`
- `frontend/src/app/(dashboard)/projects/[projectId]/api/page.tsx:652-657`
- `frontend/src/app/(dashboard)/projects/[projectId]/database/page.tsx:626-637`
- `frontend/src/app/(dashboard)/projects/[projectId]/folder/page.tsx:643-651`

**Root cause:**
Polling stops only on `completed` or `failed`. If the worker is down and the job remains pending, or if Redis loses the job state, the UI can poll indefinitely.

**Impact:**
The page appears stuck in "Generating" forever, with no actionable error.

**Fix:**
- Add a maximum polling duration (for example 5-6 minutes, slightly longer than the worker timeout).
- After the limit, show a clear "still processing, check back later" state and stop polling.
- Use exponential backoff after the first minute.
- Do not mark a job failed on transient poll errors.

**Verification:**
Stop the worker while a job is pending. The UI must stop polling and show a terminal state.

---

### BUG-19 - Login errors are lost and tokens are cleared too aggressively (P1)

**Files:**
- `frontend/src/store/slices/authSlice.ts:29-58,198-211`
- `frontend/src/lib/axios.ts:29-44`

**Root cause:**
`loginUser` removes the token on any failure, including a 503 from `/auth/me` after the login endpoint already succeeded. It also replaces the backend error with the generic "Login Failed". `fetchUser` discards the backend message.

**Impact:**
During a database or backend cold start, a user enters correct credentials, gets a generic error, and loses the newly issued token. This makes the login experience look broken.

**Fix:**
- Store the token only after `/auth/me` succeeds, or keep the token and show a retry state on 5xx.
- Remove the token only on 401.
- Preserve the backend message for 4xx/5xx.
- Add a retry affordance for 503 "warming up" responses.

**Verification:**
Mock `/auth/me` to return 503 after a successful login. The message must explain the temporary outage and the token must not be discarded prematurely.

---

### BUG-20 - Prisma query logging is always on (P2)

**File:** `backend/src/db/prisma.ts:11-14`

**Root cause:**
`log: ["query"]` is unconditional.

**Impact:**
Production log volume and overhead increase, and query parameters may leak sensitive data into logs.

**Fix:**
- Enable query logging only when `NODE_ENV !== "production"`.
- Log warnings and errors in production.

**Verification:**
Start with `NODE_ENV=production` and confirm queries are not logged.

---

### BUG-21 - Job ID collisions and orphaned AI calls (P2)

**Files:**
- `backend/src/modules/project-sections/section.controller.ts:163,245,331,418`
- `backend/src/modules/queues/aiHandler.ts:13-20`

**Root causes:**
- Section job IDs are built from `${type}-${projectId}-${Date.now()}`. Two requests in the same millisecond for the same project produce the same ID and BullMQ rejects the duplicate.
- `withTimeout` rejects after 300 seconds but does not cancel the underlying LLM request. A failed attempt can therefore keep running while the retry starts, increasing cost and load.

**Impact:**
Rare 500 errors on double-submit and duplicate AI work after timeouts.

**Fix:**
- Use `crypto.randomUUID()` for custom job IDs.
- Use an AbortController or provider request timeout where supported.
- Set the handler timeout slightly below the worker lock duration.

**Verification:**
Fire two identical generation requests concurrently and confirm both queue successfully. Confirm timed-out requests do not continue consuming provider quota.

---

### BUG-22 - Health check does not check dependencies (P1)

**File:** `backend/src/server.ts:56-64`

**Root cause:**
`/health` and `/api/health` return `ok` based only on process uptime.

**Confirmed production evidence (2026-10-22):**
`/health` returns `200` at the same time that every route after `globalLimiter` returns `500`. The health check is therefore actively hiding the current auth outage.

**Impact:**
Render and uptime monitors consider the service healthy while Redis hangs or fails every request, or while the database is down.

**Fix:**
- Add a readiness endpoint that pings Redis and the database with short timeouts.
- Return 200 only when both are reachable; return 503 with component states otherwise.
- Keep a lightweight liveness endpoint that only checks the process.

**Verification:**
Stop Redis or the database and confirm readiness reports degraded within a few seconds.

---

### BUG-23 - Rate-limiter IPv6 key handling (P2)

**File:** `backend/src/middleware/rateLimit.middleware.ts:1,38,58,83`

**Root cause:**
`ipKeyGenerator` is imported but unused. The custom key generators return a raw IP. For IPv6, this can allow a user to rotate through addresses within the same subnet and bypass per-IP limits. express-rate-limit v8 also emits `ERR_ERL_KEY_GEN_IPV6` validation warnings.

**Important:** these validation warnings were reproduced locally and are non-fatal in express-rate-limit 8.5.2; they are logged, not thrown. They are **not** the cause of the production 500 (BUG-24).

**Fix:**
- Use `ipKeyGenerator(req.ip)` for IP-based limits, or key by authenticated user ID where possible.
- Remove the unused import if the helper is not adopted.

**Verification:**
No rate-limit validation warnings at startup; IPv6 requests within one subnet share a limit.

---

### BUG-24 - Production rate limiter returns 500 on every guarded route (P0)

**Files:**
- `backend/src/middleware/rateLimit.middleware.ts:17-29,52-67`
- `backend/src/db/redis.ts:3-21`
- `backend/src/server.ts:75`
- `backend/src/middleware/error.middleware.ts:80-82,145`

**Confirmed evidence (2026-10-22):**
Against `https://planex-c7tm.onrender.com`:
- `GET /` → 200
- `GET /health` → 200
- `GET /auth/google` → 500 JSON
- `GET /auth/github` → 500 JSON
- `POST /auth/login` → 500 JSON
- `POST /auth/register` → 500 JSON
- `GET /projects` → 500 JSON
- `GET /auth/nonexistent` → 500 JSON (instead of 404)

The identical payload and status for every path after `app.use(globalLimiter)` isolates the failure to the shared rate-limiter middleware. Also confirm that the Render deployment commit matches the audited working tree, since a stale build can change which limiter code is running.

**Root cause:**
`createStore()` wraps Redis commands in a `try/catch` and returns `1` on failure as a "fail-open" fallback. That value is not a valid Redis reply for `rate-limit-redis` v5:
- `SCRIPT LOAD` must return a string SHA; `1` causes `TypeError: unexpected reply from redis client`.
- `EVALSHA` must return a two-element array; `1` causes `TypeError: Expected result to be array of values`.
- `express-rate-limit` defaults `passOnStoreError` to `false`, so the TypeError becomes an HTTP 500.

Redis command failures may come from Render environment/credentials/TLS/Upstash limits, but the code converts any such failure into a total application outage. A direct local test using the backend `.env` succeeded (`PING` → `PONG`, `SCRIPT LOAD` → 40-character SHA, `EVALSHA` → array), so the production Render values/logs must be checked separately.

**Impact:**
- Total auth outage: local login, registration, Google, and GitHub all fail.
- Total API outage for every route after the global limiter.
- The frontend has no way to recover because the error is a generic 500.

**Fix:**
- **Emergency:**
  - Replace the fake `return 1` with the real Redis reply.
  - Set `passOnStoreError: true` on `authLimiter`, `globalLimiter`, and `aiLimiter` so Redis failures fail open instead of returning 500.
  - Use `ipKeyGenerator(req.ip)` instead of raw `req.ip`.
  - Verify Render `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, and `REDIS_TLS`.
  - Read Render logs for Redis errors before and after the deploy.
- **Follow-up:**
  - Implement the bounded Redis client described in BUG-05.
  - Add readiness checks from BUG-22.
  - Add an integration test that starts the app with Redis stopped and asserts auth endpoints return non-500 responses.

**Verification:**
- Production `/projects` without a token returns 401, not 500.
- Production `/auth/login` with bad credentials returns 401, not 500.
- Production `/auth/google` and `/auth/github` redirect (302) to the provider.
- With Redis stopped locally, auth routes return within seconds with a clear 503 or a redirect, not JSON 500.
- No `unexpected reply from redis client` entries in logs.

---

### BUG-25 - Social login initiation shows a raw JSON 500 instead of a usable error page (P0)

**Files:**
- `backend/src/middleware/error.middleware.ts:130-138`
- `backend/src/modules/auth/auth.route.ts:72-107`
- `frontend/src/app/(auth)/oauth-callback/page.tsx`

**Root cause:**
The error handler only redirects to the frontend when the URL contains `/google/callback` or `/github/callback` and the request accepts HTML. Failures on the OAuth **initiation** routes (`/auth/google`, `/auth/github`) therefore return raw JSON. The browser displays that JSON on a blank page, which is what users see now.

**Impact:**
- Recruiters and users see a broken, developer-looking auth page.
- No actionable message, retry path, or link back to login.
- The same presentation bug will hide future provider configuration failures.

**Fix:**
- Fix BUG-24 first; it is the current trigger.
- In `error.middleware.ts`, treat `/auth/google` and `/auth/github` initiation paths as OAuth UI routes:
  - redirect to `/login?error=<safe message>` or a dedicated `/auth-error` page
  - keep the existing callback redirect behavior
- Return safe status codes by category:
  - 401 for invalid credentials or failed authentication
  - 503 for Redis/database/provider outages
  - 500 only for genuinely unexpected errors
- Log a request ID or correlation ID with the raw error, without secrets or tokens.
- Ensure the frontend renders a friendly error and a "Try again" button.

**Verification:**
- With Redis stopped, clicking Google/GitHub login shows a friendly error page or login message, not raw JSON.
- With Redis healthy, both providers redirect normally and complete login.
- No token appears in the error URL (see BUG-11).

---

## 4. Three-Phase Execution Plan

### Phase 1 - Authentication, Sessions, OAuth, and Access-Control Recovery (Days 1-4)

**Goal:** Make the app safe to show to recruiters: fix the production 500, restore local and social login, keep sessions alive, and close the most severe authorization holes.

**Day 1 - Restore production auth endpoints**
1. BUG-24 rate-limiter 500 (emergency):
   - remove the invalid `return 1` Redis fallback
   - enable `passOnStoreError: true`
   - verify Render Redis environment and logs
2. BUG-25 friendly OAuth initiation error handling.
3. BUG-22 readiness check for Redis and the database.
4. BUG-05 emergency slice: ensure Redis failures fail fast and fail open at the limiter.

**Verification gate:**
- `/health` is 200 only when Redis and the database are reachable; it reports 503 otherwise.
- `/projects` without a token returns 401, not 500.
- `/auth/login` with bad credentials returns 401, not 500.
- `/auth/google` and `/auth/github` return 302 to the provider.
- With Redis stopped, auth returns a clear 503 or friendly redirect, not JSON 500.

**Day 2 - Session persistence**
1. BUG-09 session strategy:
   - confirm `JWT_SECRET` is fixed in production
   - choose the access + refresh design
   - update Axios 401/refresh handling
   - add a request timeout for cold starts
2. BUG-19 login error handling and token retention.

**Verification gate:** close/reopen the browser, redeploy the backend, simulate a 503 on `/auth/me`, and confirm the user is not logged out by a temporary outage.

**Day 3 - OAuth correctness and startup safety**
1. BUG-10 email normalization and account-linking policy.
2. Absolute `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` values in production.
3. BUG-11 OAuth `state` and remove the JWT from the query string.
4. BUG-13 lazy Supabase client.

**Verification gate:** real Google and GitHub login both complete; a local account with the same email follows the chosen linking policy; mismatched `state` is rejected; no JWT appears in URLs or logs.

**Day 4 - P0 authorization and CORS**
1. BUG-01 project IDOR.
2. BUG-02 response projections.
3. BUG-03 job ownership checks.
4. BUG-04 member role scoping.
5. BUG-08 strict CORS allow-list.

**Verification gate:** two-user tests pass; API responses contain no `password`, `providerId`, or raw `inviteToken`; disallowed origins are rejected.

**Phase 1 rollback:** the rate-limiter and OAuth changes are the riskiest. Keep them in separate commits. If login regresses, revert the limiter commit first, then the OAuth presentation commit. Do not combine the session redesign with the authorization fixes in one deploy.

---

### Phase 2 - Availability, Database, and Data Integrity (Days 5-6)

**Goal:** Remove the remaining infrastructure failure modes and repair schema-level integrity.

**Day 5 - Redis, database, and deployment**
1. BUG-05 full hardening:
   - bounded application Redis client
   - queue-only `maxRetriesPerRequest: null`
   - cache helper with timeouts
2. BUG-06 Prisma adapter timeout and explicit SSL.
3. BUG-07 migration deploy step.
4. BUG-23 rate-limiter IPv6 key handling.

**Verification gate:** Redis-stopped and database-unreachable tests pass; requests fail fast with clear 503s; a fresh database is migrated before the first request.

**Day 6 - Data and API integrity**
1. BUG-12 cascade migration and deletion flow.
2. BUG-14 chat limiter and input bounds.
3. Add integration checks for project deletion with members.

**Verification gate:** delete a shared project with one editor and one viewer; no orphan member rows and no foreign-key errors; chat abuse returns 429.

**Phase 2 rollback:** the cascade migration should be additive and reviewed. Apply it in a transaction; keep a database backup. If refresh tokens were introduced in Phase 1, keep the old JWT validation active during the transition.

---

### Phase 3 - Reliability, Frontend Resilience, and Hardening (Days 7-9)

**Goal:** Eliminate intermittent false failures and improve observability and UX.

**Day 7 - Queue and rate-limit correctness**
1. BUG-15 final-attempt failure semantics.
2. BUG-16 polling-aware rate limits.
3. BUG-21 job ID collisions and request cancellation.
4. BUG-20 conditional Prisma logging.

**Verification gate:** force attempt 1 to fail and attempt 2 to succeed; three tabs poll without 429; no duplicate job ID errors under concurrent submissions.

**Day 8 - Frontend resilience**
1. BUG-17 Suspense boundary and `next build`.
2. BUG-18 polling timeout and backoff.
3. BUG-19 follow-up UX for retry and degraded states.

**Verification gate:** production frontend build succeeds; worker-down simulation ends in a clear terminal state, not an infinite spinner.

**Day 9 - Hardening and regression pass**
1. Run backend and frontend typechecks.
2. Run the frontend production build.
3. Execute the manual checklist in Section 6.
4. Review logs for leaked secrets and noisy queries.
5. Document deployment and rollback steps.

**Phase 3 rollback:** frontend changes are independently deployable from backend queue changes. Deploy the backend first, then the frontend, so status semantics remain backward compatible.

---

## 5. Fix Order by Priority (Single List)

| Order | ID | Priority | Why now |
| --- | --- | --- | --- |
| 1 | BUG-24 | P0 | Current total auth and API outage; every guarded route returns 500 |
| 2 | BUG-25 | P0 | Social login exposes raw JSON 500 to recruiters |
| 3 | BUG-22 | P1 | Health check hides the current outage |
| 4 | BUG-09 | P0 | Repeated login is the most visible session failure |
| 5 | BUG-19 | P1 | Login errors are misleading and tokens are discarded too early |
| 6 | BUG-10 | P0 | Social login duplicate accounts and account-linking failures |
| 7 | BUG-11 | P1 | OAuth CSRF and JWT leakage in URLs |
| 8 | BUG-13 | P1 | Optional Supabase config can crash auth at startup |
| 9 | BUG-01 | P0 | Active data breach via project ID |
| 10 | BUG-02 | P0 | Password hash and provider-ID exposure |
| 11 | BUG-03 | P0 | Active data breach via job enumeration |
| 12 | BUG-04 | P0 | Cross-project authorization bypass |
| 13 | BUG-08 | P1 | Origin allow-list bypass |
| 14 | BUG-05 | P0 | Full Redis hardening after the emergency limiter fix |
| 15 | BUG-06 | P0 | Requests can hang when the database is unreachable |
| 16 | BUG-07 | P0 | Fresh deployments have no schema |
| 17 | BUG-23 | P2 | IPv6 rate-limit bypass |
| 18 | BUG-12 | P1 | Shared project deletion is broken |
| 19 | BUG-14 | P1 | AI abuse and quota exhaustion |
| 20 | BUG-15 | P0 | False AI failures on retryable errors |
| 21 | BUG-16 | P1 | Polling causes false rate-limit failures |
| 22 | BUG-21 | P2 | Rare duplicate job IDs and wasted AI calls |
| 23 | BUG-20 | P2 | Production log overhead and leakage |
| 24 | BUG-17 | P1 | Possible deployment build failure |
| 25 | BUG-18 | P1 | Infinite polling and stuck UI |

---

## 6. Manual Verification Checklist

### Security
- [ ] User A cannot read or update User B's project.
- [ ] User A cannot read User B's job result.
- [ ] Project owner cannot mutate a member of another project.
- [ ] API responses contain no `password`, `providerId`, or raw `inviteToken`.
- [ ] Disallowed origins do not receive CORS approval.
- [ ] OAuth callback rejects a missing or mismatched `state`.
- [ ] No JWT appears in URLs, referrers, or server logs.

### Availability
- [ ] Production `/projects` without a token returns 401, not 500.
- [ ] Production `/auth/login` with bad credentials returns 401, not 500.
- [ ] Production `/auth/google` and `/auth/github` return 302 to the provider.
- [ ] API responds within seconds when Redis is stopped.
- [ ] API returns a clear 503 when the database is unreachable, not a hang.
- [ ] API fails open or returns a clear 503 when Redis is unavailable, never JSON 500.
- [ ] Readiness endpoint reports degraded when Redis or the database is down.
- [ ] A fresh database is fully migrated before the first request.
- [ ] The backend starts with optional Supabase variables empty.

### Authentication and Session
- [ ] Local login works.
- [ ] Google login works for a new user.
- [ ] GitHub login works for a new user.
- [ ] Social login shows a friendly error page, not raw JSON, when a dependency is down.
- [ ] A local account with the same email behaves according to the chosen linking policy.
- [ ] A Google account with a dotted Gmail address does not create a duplicate.
- [ ] The user remains logged in after closing and reopening the browser within the intended session lifetime.
- [ ] The user is not logged out by a 503 or network error.
- [ ] The user is not logged out by an unrelated 401 from a background request.
- [ ] Redeploying the backend with a stable `JWT_SECRET` keeps existing sessions valid.

### Jobs and AI
- [ ] First-attempt AI failure followed by a successful retry still shows success.
- [ ] Multiple tabs polling jobs do not hit 429.
- [ ] Polling stops with a clear message if the worker is down.
- [ ] Concurrent generation requests do not collide on job IDs.
- [ ] Timed-out AI requests do not continue consuming quota.

### Frontend
- [ ] `frontend` production build succeeds.
- [ ] `/oauth-callback` renders without a Suspense error.
- [ ] Login errors show the actual backend message.
- [ ] A temporary 503 shows a retry path, not a generic "Login Failed".

---

## 7. Guardrails to Avoid Breaking Production

1. **One phase per deploy.** Do not combine the Redis client change with the cascade migration.
2. **Back up the database before Phase 2.** The cascade migration is the only schema change.
3. **Keep migrations backward compatible.** Add cascades in a separate migration; do not rename or drop columns during this work.
4. **Deploy backend before frontend** when job status semantics change.
5. **Use environment variables for all secrets and URLs.** Never commit `.env` files.
6. **Keep `JWT_SECRET` static.** Rotating it logs out every user.
7. **Test with two real accounts.** Most security bugs here require a second user to reproduce.
8. **Test with Redis stopped and with the database paused.** These are the two outage modes that produce the reported symptoms.
9. **Watch logs during rollout.** Specifically watch for rate-limit warnings, Redis reconnect loops, Prisma timeouts, and OAuth callback errors.
10. **Have a rollback commit for each phase.** Redis client and queue changes are the highest-risk rollback points.
11. **Never return fake Redis replies.** A store callback must return a valid Redis reply or fail open through `passOnStoreError`; returning `1` or `{}` turns every request into a 500.
12. **Verify production, not only localhost.** The local Redis test passed while production returned 500 on every guarded route. Compare Render environment variables and logs before declaring the fix complete.
13. **Keep auth deploys small.** Deploy the limiter fix first, verify `/auth/google`, `/auth/github`, and `/auth/login`, then deploy session and OAuth changes separately.

---

## 8. Open Decisions Before Implementation

1. **OAuth account linking:** automatically link a social login to an existing password account with the same verified email, or continue rejecting with a clear message?
2. **Session lifetime:** long-lived JWT in `localStorage`, or short access token plus refresh token in an `httpOnly` cookie?
3. **Account email normalization:** keep Gmail dot normalization, or store provider emails exactly as received and compare case-insensitively?
4. **Deployment target:** the backend is confirmed on Render at `https://planex-c7tm.onrender.com`; confirm that `JWT_SECRET` and Redis variables are fixed environment variables and not regenerated per deploy.
5. **Worker topology:** keep the BullMQ worker in the web process, or move it to a separate service for reliability and independent scaling?
6. **OAuth error destination:** redirect failed social-login initiation to `/login?error=...` or render a dedicated `/auth-error` page with retry actions?
7. **Production observability:** confirm access to Render logs and whether request IDs / Sentry-style error tracking should be added before Phase 1 deploy.

---

## 9. Notes and Assumptions

- Line numbers reflect the code as audited on 2026-10-22. Re-check before patching.
- The production frontend is `https://planex-one.vercel.app`; its built JavaScript points to the Render backend at `https://planex-c7tm.onrender.com`, so the Vercel API URL appears to be configured correctly.
- `frontend/.env.local` only contains `NEXT_PUBLIC_API_URL=http://localhost:5000`; it is not the production value. Production API configuration is baked into the Vercel build.
- Live verification on 2026-10-22 showed `/health` and `/` returning 200 while every guarded route returned the same JSON 500. The immediate cause is BUG-24, not OAuth credentials.
- A direct local Redis check using the backend `.env` succeeded (`PING`, `SCRIPT LOAD`, `EVALSHA`). The Render Redis values and logs must still be checked; local success does not prove production Redis is healthy.
- The frontend Suspense issue is strongly suspected but was not confirmed with `next build` because only dev artifacts exist locally.
- The repeated-login issue is most likely the one-day JWT expiry, but it should be confirmed by checking whether `JWT_SECRET` is stable and whether the production origin is consistent.
- No source code, configuration, or database schema was modified while producing this document. Only this audit file was updated.
