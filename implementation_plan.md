# Production Readiness Audit & Bug Fixes Plan

A comprehensive review of the Planex backend and frontend was conducted to identify runtime bugs, type mismatches, security vulnerabilities, and configuration flaws before production deployment.

## User Review Required

> [!IMPORTANT]
> **CORS Security Configuration**: In production, `app.use(cors())` with default settings allows any external domain to make requests to the backend API. We will configure CORS to allow requests from `FRONTEND_URL` and `localhost` with credentials support.

> [!WARNING]
> **Rate Limiter Key Generation**: `ipKeyGenerator` in `rateLimit.middleware.ts` was passing `req.ip` string to a function expecting an Express request object, causing fallback key lookup errors. We will update all rate limiters to safely extract `req.ip`.

## Proposed Changes

### Backend Infrastructure & Security

#### [MODIFY] [express.d.ts](file:///d:/Projects/Web/Planex/backend/src/types/express.d.ts)
- Update `Express.User` interface definition for `id` from `number` to `string` (matching Prisma's UUID primary key).

#### [MODIFY] [auth.middleware.ts](file:///d:/Projects/Web/Planex/backend/src/middleware/auth.middleware.ts)
- Update `DecodedToken` interface `userId` from `number` to `string`.
- Ensure fallback handling if `JWT_SECRET` is missing.

#### [MODIFY] [rateLimit.middleware.ts](file:///d:/Projects/Web/Planex/backend/src/middleware/rateLimit.middleware.ts)
- Fix `keyGenerator` for `authLimiter`, `globalLimiter`, and `aiLimiter` to safely resolve `req.ip || "127.0.0.1"`.

#### [MODIFY] [server.ts](file:///d:/Projects/Web/Planex/backend/src/server.ts)
- Replace default open `cors()` with origin-filtering CORS using `process.env.FRONTEND_URL` and `credentials: true`.

#### [MODIFY] [auth.controller.ts](file:///d:/Projects/Web/Planex/backend/src/modules/auth/auth.controller.ts)
- Fix `getUser` response status code from `201` to `200`.
- Fix typos in authentication success messages ("successfull" -> "successful").

---

### Frontend API Client

#### [MODIFY] [axios.ts](file:///d:/Projects/Web/Planex/frontend/src/lib/axios.ts)
- Update 401 response interceptor to check current `window.location.pathname` so that returning 401 while on `/login` or `/register` displays in-page validation errors without triggering full page reloads.

## Verification Plan

### Automated Verification
- Verify TypeScript types across backend and frontend.

### Manual Verification
- Test user registration, login, and token generation.
- Test OAuth flow error handling and redirects.
- Test AI generation endpoints and Copilot chat without rate-limiter or queue errors.
