# API.md

Base URL: same origin as the frontend (e.g. `http://localhost:4000`).
All request/response bodies are JSON. Authenticated endpoints require
`Authorization: Bearer <token>`.

## Auth

### `POST /api/auth/register`
Body: `{ name, email, password, phone? }` (password ≥ 8 chars)
→ `201 { token, user }` · `409` if email taken · `400` on validation error
Rate-limited: 10 requests/min/IP.

### `POST /api/auth/login`
Body: `{ email, password }` → `200 { token, user }` · `401` on bad credentials
(same error for "no such user" and "wrong password" — doesn't leak which
emails are registered). Rate-limited.

### `POST /api/auth/logout-everywhere` 🔒
Bumps `token_version`, invalidating every token previously issued to this
user. → `200 { ok: true }`

### `GET /api/auth/me`
→ `200 { user }` (`user: null` if not authenticated — never errors)

## Profile

### `PUT /api/profile` 🔒
Body: `{ name, phone?, address?, installLocation? }` → `200 { user }`

### `PUT /api/profile/password` 🔒
Body: `{ currentPassword, newPassword }` → `200 { ok }` · `401` if
`currentPassword` is wrong. Bumps `token_version` (other sessions must
log in again).

## Packages

### `GET /api/packages`
Public. → `200 { packages: [...] }`

### `GET /api/packages/:id`
Public. → `200 { package }` · `404`

## Solar calculator

### `POST /api/solar/calculate`
Public (works for guests; associated with the caller if authenticated).
Body: `{ monthlyBill?, monthlyUsage?, roofArea?, independence? }`
→ `200 { result: { dailyConsumptionKwh, monthlyConsumptionKwh,
recommendedCapacityKw, estimatedPanels, monthlyProductionKwh,
coveragePercent, batteryRecommendationKwh, suggestedPackageId,
roofConstrained, assumptions } }`
Deterministic — same input always returns the same output (no
`Math.random()`). Every call is persisted to `solar_calculations`.

## Orders

### `GET /api/orders` 🔒
→ `200 { orders }` — only the caller's own orders.

### `GET /api/orders/:id` 🔒
→ `200 { order }` · `403` if the order belongs to another user · `404`

### `POST /api/orders` 🔒
Body: `{ packageId, address? }`. Optional header `Idempotency-Key: <any
string>` — a retried request with the same key returns the original
order instead of creating a duplicate.
→ `201 { order }`. **`price` in the request body, if any, is ignored —
the price is always looked up from the `packages` table.**

### `POST /api/orders/:id/pay` 🔒
Runs the configured payment adapter (dev-simulator by default — see
`ARCHITECTURE.md` §5). On success: order → `CONFIRMED`/`PAID`, a
`solar_systems` row and a notification are created, all in one
transaction. → `200 { order, payment }` · `402` on a failed charge ·
`409` if already paid.

## Systems / controller

### `GET /api/systems` 🔒
→ `200 { systems }` — only the caller's own.

### `GET /api/systems/:id/controller` 🔒
→ `200 { state, connection, hourlyProductionKw, capacityKw, modes,
componentHealth }`. `connection` is one of `LIVE` / `STALE` /
`DISCONNECTED` / `UNKNOWN`, derived from the latest telemetry row's age.

### `PUT /api/systems/:id/modes` 🔒
Body: any subset of `{ batteryUsage, energySaving, gridPriority,
solarPriority, batteryReserve }` → `200 { modes }`

### `POST /api/systems/:id/ingest` 🔒
Real-device integration point (unexercised — no hardware in this build).
Body: `{ solarProductionKw, homeConsumptionKw, batteryPercent,
gridUsageKw }` → `201 { ok: true }`

## Notifications

### `GET /api/notifications` 🔒
→ `200 { notifications }` (latest 100, newest first)

### `POST /api/notifications/:id/read` 🔒
→ `200 { ok: true }` · `403` if it belongs to another user

## Neighborhoods

### `GET /api/neighborhoods`
Public; if authenticated, each item includes `joined: boolean`.

### `GET /api/neighborhoods/activity`
Public feed of recent join/create events.

### `POST /api/neighborhoods` 🔒
Body: `{ name, location?, homes?, interestedHomes? }` → `201
{ neighborhood }` (creator auto-joins)

### `POST /api/neighborhoods/:id/join` 🔒
→ `200 { neighborhood }` · `409` if already joined or already full — the
`UNIQUE(neighborhood_id, user_id)` DB constraint is what actually
prevents a duplicate join even under a race, not just this check.

## Error shape

Every error is `{ "error": "message", "details"?: ... }` with an
appropriate HTTP status (400/401/403/404/409/413/429/500). See
`SECURITY.md` for what each status is used for.
