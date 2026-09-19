# ARCHITECTURE.md

## 1. Stack, and why

| Layer | Choice | Why |
|---|---|---|
| Frontend | Existing vanilla HTML/CSS/JS, unchanged in structure | Already worked; no migration justification (see AUDIT_REPORT §6) |
| Backend | Node.js, **built-in `http` only** (no Express) | See "Why no npm packages" below |
| Database | **`node:sqlite`** (Node 22's built-in SQLite binding) | Real relational DB, real constraints/transactions, zero install |
| Auth | scrypt password hashing + HMAC-signed stateless tokens, both via `node:crypto` | No bcrypt/jsonwebtoken available; these are the same primitives those libraries wrap |
| Payments | Adapter interface; dev-simulator by default | No real provider specified, no credentials available |
| Tests | `node --test` (Node's built-in test runner) | No Jest/Mocha available; built-in runner needs nothing extra |

### Why no npm packages
This environment has **no network access** (`npm install` returns `403 Forbidden` against the registry). Rather than leave the "real backend" requirement unmet, everything was built on what Node 22 ships with.

`node:sqlite` is still labeled **experimental** by Node.js. It behaved correctly through the whole test suite and manual smoke tests, but pin your Node version in production and watch the Node changelog — see `DEPLOYMENT.md`.

## 2. Request flow

```
Browser (static HTML/CSS/JS, served from the same origin)
   │  fetch('/api/...', { headers: { Authorization: 'Bearer <token>' } })
   ▼
server/server.js  — one process, one port
   ├─ /api/*  → server/src/router.js → route handlers (server/src/routes/*.js)
   │              └─ middleware/auth.js (token verify, ownership checks)
   │              └─ validate.js (input validation)
   │              └─ node:sqlite prepared statements (server/src/db.js)
   └─ everything else → static file server (serves ../index.html, ../pages, ../css, ../js)
```

Single origin (frontend + API share one Node process/port) — deliberate for simplicity in development and deployment.

## 3. Database

See `DATABASE.md` for the full schema. SQLite with WAL mode, foreign keys enabled, and transactions for critical multi-step operations (order payment + system provisioning).

## 4. Auth model

- Passwords: scrypt (Node crypto)
- Tokens: HMAC-SHA256 signed, contain user id + token_version
- `token_version` bumped on password change or logout-everywhere → all previous tokens invalidated

## 5. Payment adapter

Interface in `server/src/services/payment-adapter.js`. Default is a dev simulator that always succeeds. Real providers can be plugged in later.
