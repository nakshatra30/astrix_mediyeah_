# Astrix Media — Backend

Security-hardened REST API for the Astrix Media portfolio site: public content browsing, a contact/enquiry pipeline, and an authenticated admin console for managing projects, categories, services, testimonials, enquiries, media uploads, and site settings.

Built with **Express 5 + TypeScript (ESM) + Prisma 7 (driver adapters) + PostgreSQL**. The Bruno API collection in [`bruno/`](bruno/Astrix_Media_Bruno_Collection/) is the API contract — every endpoint, status code, and payload in this backend implements it exactly.

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [API summary](#api-summary)
- [Response envelopes](#response-envelopes)
- [Testing the API with Bruno](#testing-the-api-with-bruno)
- [Security model](#security-model)
- [Tests](#tests)
- [Project structure](#project-structure)
- [Production checklist](#production-checklist)

## Requirements

- Node.js **20.19+** (developed and verified on Node 24)
- A PostgreSQL database (any Neon project works great)
- npm 10+

## Quick start

```bash
cd backend

# 1. Install dependencies (bcrypt ships prebuilt binaries for common platforms).
npm install

# 2. Configure the environment.
cp .env.example .env
# Edit .env — set DATABASE_URL (see Configuration below).

# 3. Generate the Prisma client (requires .env to exist, even for this step).
npm run prisma:generate

# 4. Create the schema.
npm run prisma:migrate        # dev: creates + applies a migration

# 5. Seed demo content used by the Bruno collection (never runs in production).
npm run db:seed:dev

# 6. Create your first admin user (interactive prompt).
npm run admin:create

# 7. Start the dev server on http://localhost:5000.
npm run dev
```

Production deploy:

```bash
npm ci
npm run build
npm run prisma:deploy   # applies committed migrations only
npm start               # runs compiled JS from dist/
```

## Configuration

All configuration lives in `backend/.env` (see `.env.example`). Required values:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Used by **both** the app and the Prisma CLI. |
| `SESSION_SECRET` | 64+ hex chars used to sign session cookies. Generate: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. |
| `SESSION_COOKIE_NAME` | Session cookie name (default `astrix.sid`). |
| `SESSION_TTL_HOURS` | Session lifetime; sliding expiry (default 8). |
| `BCRYPT_ROUNDS` | bcrypt cost factor (default 12; tests use 4). |
| `CLIENT_URL` | Allowed browser origin for CORS (default `http://localhost:5173`). |
| `PUBLIC_BASE_URL` | Public origin of this API; used to build media URLs (default `http://localhost:5000`). |
| `SHADOW_DATABASE_URL` | Separate DB for Prisma `migrate dev` shadow schema. |
| `TEST_DATABASE_URL` | Database the test suite runs against. |

Optional (media storage switches to Cloudinary when all four are set; otherwise files are stored locally under `backend/uploads/` and served from `/uploads/`):

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### Database URLs (Neon)

For an admin backend, use the **direct (non-pooled)** Neon connection string for both the app and the CLI — traffic is low and direct connections avoid PgBouncer's transaction-mode limitations with Prisma:

```
postgresql://<role>:<password>@<endpoint-host>/<database>?sslmode=require
```

Keep `SHADOW_DATABASE_URL` and `TEST_DATABASE_URL` on separate, disposable databases (e.g. `astrix_shadow`, `astrix_test`).

> **Note:** `prisma.config.ts` reads `DATABASE_URL`, so a fresh clone needs `.env` in place before `npm run prisma:generate` works.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server via tsx with file watching. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run the compiled server. |
| `npm run admin:create` | Interactive CLI to create/reset an admin user. |
| `npm run db:seed:dev` | Idempotent demo data for the Bruno flow (dev only). |
| `npm run prisma:generate` | Regenerate the Prisma client into `src/generated/prisma`. |
| `npm run prisma:migrate` | `prisma migrate dev` — create/apply migrations in development. |
| `npm run prisma:deploy` | `prisma migrate deploy` — apply committed migrations. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Run the integration test suite (vitest). |
| `npm run test:watch` | Watch mode. |

## API summary

Base URL: `/api/v1`. All list endpoints accept `page` and `pageSize` (max 50) and return a `meta` pagination object.

### Public

| Method & Path | Purpose |
| --- | --- |
| `GET /health` | Liveness probe. |
| `GET /projects?page&pageSize&division&sort=newest\|oldest` | Published projects only. |
| `GET /projects/:slug` | One published project (with images). |
| `GET /categories?division` | Active categories only. |
| `GET /services?division` | Active services only. |
| `GET /services/:slug` | One active service. |
| `GET /testimonials?page&pageSize` | Published testimonials only. |
| `GET /site-settings` | Public site settings (nulls until configured). |
| `POST /enquiries` | Submit a contact enquiry (rate-limited, consent required). |

### Auth (session cookie + CSRF)

| Method & Path | Purpose |
| --- | --- |
| `POST /auth/login` | Email + password; sets HttpOnly session cookie. |
| `GET /auth/me` | Current admin; response includes `data.csrfToken`. |
| `POST /auth/logout` | Destroys the session (requires CSRF header; 204). |
| `POST /auth/change-password` | Rotates password, revokes all other sessions. |

### Admin (all require session; mutations require `X-CSRF-Token`)

| Method & Path | Purpose |
| --- | --- |
| `GET /admin/projects?page&pageSize&division&status&sort` | All projects incl. drafts. |
| `POST /admin/projects` · `PATCH /admin/projects/:id` (partial) | Create / partial-update. |
| `DELETE /admin/projects/:id` | Soft delete → `ARCHIVED` (200 + data). |
| `GET /admin/projects/:id` | Single project. |
| `GET/POST/PATCH/DELETE /admin/categories...` | Categories; DELETE soft-deactivates. |
| `GET/POST/PATCH/DELETE /admin/services...` | Services; DELETE soft-deactivates. |
| `GET/POST/PATCH/DELETE /admin/testimonials...` | Testimonials; DELETE hard-deletes. |
| `GET /admin/enquiries?page&pageSize&status` | Enquiry pipeline. |
| `PATCH /admin/enquiries/:id` | Update status (`NEW`/`IN_PROGRESS`/`CLOSED`/...). |
| `GET /admin/enquiries/:id` · `GET /admin/enquiries/:id/notes` | Detail with notes. |
| `POST /admin/enquiries/:id/notes` | Add internal note. |
| `GET /admin/site-settings` · `PATCH /admin/site-settings` | Read / partial-update settings. |
| `GET /admin/media?page&pageSize` | Media library. |
| `POST /admin/media` | Multipart upload, field `file`, images only, max 5 MB. |
| `DELETE /admin/media/:id` | Hard delete (409 if referenced). |

There is intentionally **no** enquiry delete endpoint.

## Response envelopes

Success: `{ "data": ..., "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 } }` (`meta` only on lists).

Error: `{ "error": { "code": "...", "message": "...", "details": [...], "requestId": "..." } }`.

Common codes: `VALIDATION_ERROR` (400), `INVALID_CREDENTIALS` (401), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `UNSUPPORTED_MEDIA_TYPE` (415), `PAYLOAD_TOO_LARGE` (413), `INTERNAL_ERROR` (500). Every response carries an `X-Request-Id` header; supply your own to correlate logs.

## Testing the API with Bruno

The collection lives at `bruno/Astrix_Media_Bruno_Collection/`.

1. Open it in the Bruno desktop app and select the **Local** environment.
2. Set the `adminPassword` secret to your admin's password (created via `npm run admin:create`).
3. Run the requests **in folder order** — captures chain: Login → Me (captures `csrfToken`) → Create Category/Service/Project/Testimonial (capture IDs) → Submit Enquiry → Upload Media. `publishedProjectSlug` (`astrix-bruno-demo-project`) and `serviceSlug` (`website-development`) reference seeded records created by `npm run db:seed:dev`.
4. `11 Negative Tests` verifies 401 on unauthenticated admin access.

## Security model

- **Sessions**: DB-backed, opaque 256-bit IDs in an HttpOnly, SameSite=Lax cookie (Secure in production), 8-hour sliding expiry. No JWTs — revocation is instant (`logout`, password change, expiry).
- **CSRF**: per-session 256-bit token, returned by `GET /auth/me`, required on every state-changing admin request via the `X-CSRF-Token` header; compared with `timingSafeEqual`.
- **Passwords**: bcrypt (cost 12); login timing is equalized for unknown emails; change-password revokes other sessions.
- **Rate limiting**: global 300 req/min/IP, login 10/15 min, enquiry 10/15 min (in-memory store — one instance per process).
- **Headers**: strict CSP (`default-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`, `form-action 'none'`), `X-Content-Type-Options: nosniff`, no-referrer, CORP, HSTS + trust-proxy in production only. No `X-Powered-By`.
- **Input**: strict Zod schemas (unknown keys rejected), sanitize-html allowlist on rich text, control-char stripping, magic-byte image sniffing, 1 MB JSON limit, 5 MB upload limit.
- **SQL**: Prisma parameterized queries only.
- **Uploads**: stored with random names, never executed; referenced assets cannot be deleted (409).
- **Secrets**: `.env` is git-ignored; `SESSION_SECRET` required at boot.

## Tests

```bash
cd backend
npm test
```

Integration tests run against `TEST_DATABASE_URL` (migrations are applied automatically by the suite's global setup). The suite covers auth/session/CSRF flows, all CRUD endpoints, public visibility rules, soft-delete semantics, upload validation, XSS sanitization, security headers, CORS, and rate limiting. Rate-limit tests run in an isolated worker so limiter state cannot leak between files.

## Project structure

```
backend/
  prisma/schema.prisma        # Data model (11 tables)
  prisma.config.ts            # Prisma CLI config (datasource + seed)
  src/
    app.ts                    # createApp() — middleware stack
    server.ts                 # listen + graceful shutdown
    config/                   # env loading, Prisma client (driver adapter)
    middleware/               # session, CSRF, rate limits, errors, request-id
    modules/                  # one folder per domain (routes/controller/validation)
    storage/                  # media storage backends (local / Cloudinary)
    scripts/                  # admin:create, dev seed
    generated/prisma/         # generated client (git-ignored)
  tests/                      # vitest integration suite
bruno/                        # API contract + runnable collection
```

## Production checklist

- [ ] `NODE_ENV=production` (enables HSTS, Secure cookies, trust proxy, disables seed).
- [ ] Strong `SESSION_SECRET` (unique per deployment).
- [ ] `CLIENT_URL` / `PUBLIC_BASE_URL` set to real origins.
- [ ] Run `npm run prisma:deploy`, not `migrate dev`.
- [ ] Configure Cloudinary (or accept local disk + serve `/uploads` from a CDN).
- [ ] Ship behind HTTPS and consider a shared Redis store if you scale beyond one process (rate limiters are per-instance).
- [ ] Rotate the initial admin password after first login.
