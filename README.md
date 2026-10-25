# 🚀 Planex

> **AI-powered software project planning platform that transforms an idea into a structured engineering blueprint.**

Planex helps developers, founders, and teams convert a software idea into a production-ready project plan using a multi-stage AI pipeline. Instead of generating a single block of text, Planex produces structured engineering artifacts including project requirements, database design, API architecture, and folder structure.

The platform follows a **human-in-the-loop** workflow where AI generates structured suggestions, users review and refine them, and only approved content is persisted.

---

# ✨ Features

## 🧠 Multi-Stage AI Planning Pipeline

Transform a simple project idea into a complete software architecture through a staged AI workflow.

```text
Idea
   ↓
Requirements & Overview
   ↓
Database Design
   ↓
API Architecture
   ↓
Folder Structure
```

Each stage consumes previously approved project data, producing more consistent and context-aware results.

---

## 💡 Intelligent Idea Expansion

Generate:

* Product overview
* Core features
* Functional requirements
* Suggested technology stack
* Complexity estimation
* Recommended team size

---

## 🗄️ Database Architecture Generation

Generate structured database designs with:

* Entities
* Fields
* Relationships
* Index suggestions
* Production-ready schema planning

---

## 🌐 API Architecture Generation

Generate APIs organized by **application modules**.

Examples include:

* Authentication
* Users
* Projects
* Notifications
* AI Services
* External Integrations

Each module may contain:

* REST Endpoints
* WebSocket Events
* Webhooks

---

## 📂 Folder Structure Generation

Automatically generate scalable folder structures for modern full-stack applications with organized frontend, backend, AI, services, middleware, and infrastructure layers.

---

## 🤖 AI Copilot

Planex includes an AI Copilot that understands the current project context and assists throughout the planning workflow.

Capabilities include:

* Context-aware project guidance
* Architecture suggestions
* Database improvement recommendations
* API design assistance
* Folder structure refinement
* Interactive AI editing before persistence

---

## ✍️ Human-in-the-Loop AI

AI suggestions are never automatically persisted.

```text
Generate
    ↓
Review
    ↓
Edit
    ↓
Approve
    ↓
Save
```

This keeps developers in control while leveraging AI for architecture generation.

---

## ⚡ Redis-Powered AI Caching

Planex caches generated AI responses using Redis to:

* Reduce repeated LLM requests
* Improve response times
* Lower AI generation costs
* Reuse previously generated project sections whenever possible

---

## 📬 Background AI Processing

Long-running AI generation tasks are processed using **BullMQ**.

Benefits include:

* Reliable asynchronous processing
* Scalable AI execution
* Queue-based architecture
* Foundation for retries and progress tracking

---

## 🛡️ Validation & Safe AI Responses

### Request Validation

* Express Validator
* Structured field-level validation
* Consistent API error responses

### AI Response Validation

Every AI-generated section is validated using **Zod** before it is returned or persisted.

* Invalid AI responses are rejected
* Detailed validation issues remain on the backend
* Generic user-friendly errors are returned
* Invalid outputs are never saved

---

## 🚦 Redis-Based Rate Limiting

Planex uses distributed rate limiting backed by Redis.

Separate rate limits are configured for:

* Authentication endpoints
* General API requests
* AI generation endpoints

This approach scales across multiple server instances while protecting the platform from abuse.

---

## 🎨 Modern Validation UX

The frontend provides:

* Inline field validation
* Red input highlighting
* Automatic error clearing while typing
* Global server error banners
* Immediate feedback before submission

---

# 🏗️ System Architecture

```text
Frontend (Next.js)
        ↓
Express API
        ↓
Authentication & Authorization
        ↓
BullMQ AI Queue
        ↓
AI Orchestrator
        ↓
Prompt Builder
        ↓
Groq LLM
        ↓
Zod Response Validation
        ↓
Redis Cache
        ↓
Structured Project Sections
        ↓
User Review & Approval
        ↓
PostgreSQL
```

---

# ⚙️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Redux Toolkit
* Tailwind CSS

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL
* Prisma ORM

### AI

* Groq LLM
* Multi-stage AI Pipeline
* AI Orchestrator
* Prompt Engineering
* Context-aware Generation
* Zod AI Response Validation

### Background Processing

* BullMQ

### Caching

* Redis

### Security

* JWT Authentication
* Google OAuth (Passport.js)
* Redis-backed Rate Limiting
* Role-Based Access Control

### Infrastructure

* Docker
* Docker Compose

---

# 🧠 AI Engineering Highlights

Planex is built using modern AI engineering practices:

* Multi-stage AI orchestration
* Context-aware prompt chaining
* Structured JSON generation
* Runtime AI validation with Zod
* Human approval before persistence
* Modular AI architecture
* AI Copilot
* Redis caching
* BullMQ job processing

---

# 🔐 Security

* JWT Authentication
* Google OAuth (Passport.js)
* Owner / Editor / Viewer permissions
* Role-based authorization
* Redis-backed distributed rate limiting
* Structured request validation
* Safe AI response validation

---

# 🐳 Docker Support

Planex is fully containerized using Docker and Docker Compose.

The development environment consists of separate containers for:

* Frontend
* Backend
* PostgreSQL
* Redis (Alpine)

This setup provides a consistent development workflow and simplifies deployment across environments.

### Database migrations

The backend applies pending Prisma migrations before starting (`npm start` runs `prisma migrate deploy`). Docker Compose does the same for the dev server.

For a multi-replica production deployment, run migrations once as a release step and start the replicas without the migration step:

```bash
npm run migrate:deploy
npm run start:no-migrate
```

Production `DATABASE_URL` values should include TLS and a connect timeout, for example:

```text
postgresql://user:password@host:5432/planex?sslmode=require&connect_timeout=10
```

### Keep-alive and database availability

The backend exposes three probes:

- `GET /live` — process-only liveness. Does not touch Postgres or Redis.
- `GET /health` — readiness. Pings Postgres and Redis with short timeouts.
- `GET /keepalive` — explicit keep-alive. Pings Postgres and returns `503` if the database is unavailable. It intentionally does not touch Redis, so scheduled keep-alives do not consume Upstash commands.

For production, point the external scheduler (Upstash QStash, cron, or an uptime monitor) at `/keepalive` every 5 minutes. If `KEEPALIVE_SECRET` is set, send it as the `x-keepalive-secret` header.

The backend also runs an in-process database ping while it is awake. Configure it with:

```text
KEEPALIVE_INTERVAL_MS=240000
```

Set it to `0` to disable the in-process timer. A free Supabase project can still pause; use a plan that does not auto-pause for production.

### Password recovery without email

Planex does not send email. A signed-in user generates a one-time recovery code from **Profile → Password recovery**. The code is hashed in the database and shown once. The user can then reset their password at `/forgot-password` with their email, recovery code, and a new password.

If an existing user is locked out and has no recovery code, an operator can generate one directly:

```bash
cd backend
npx ts-node src/scripts/generateRecoveryCode.ts user@example.com
```

Give the printed code to the user through your normal support channel, then ask them to reset it immediately at `/forgot-password`.

---

# 🚀 Roadmap

Upcoming features:

* 📘 Project Blueprint Export (PDF / Markdown / ZIP)
* 🗺️ Development Roadmap Generator
* 📡 Real-time AI Generation Progress (Might add)
* 📈 Project Analytics Dashboard

---

# 📌 Current Status

🚧 **Deploying Soon**

The first production release is feature-complete and currently undergoing final testing and deployment preparation.
