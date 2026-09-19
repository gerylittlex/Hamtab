# هم‌تاب (HamTab) — Solar Energy Platform

A Persian (RTL) solar-energy platform: size a solar system, browse and
order packages, monitor an installed system's controller, manage your
account from a dashboard, and join or start a community "solar
neighborhood" campaign.

This was rebuilt from a front-end-only prototype (see `AUDIT_REPORT.md`)
into a working full-stack app: real accounts, a real database, real
order/payment flow, real telemetry pipeline. See `FINAL_REPORT.md` for
exactly what changed and what's still simulated/incomplete.

## Stack

- **Frontend**: plain HTML5/CSS3/vanilla JS (unchanged structure from the
  original prototype — see AUDIT_REPORT.md §6 for why no framework
  migration was done)
- **Backend**: Node.js, built-in `http` only — no Express
- **Database**: SQLite via Node's built-in `node:sqlite`
- **Auth**: scrypt password hashing + HMAC-signed session tokens, via
  `node:crypto`

**Zero third-party npm dependencies**, by necessity (this was built in an
environment with no network access to the npm registry) and, as it turns
out, without loss of functionality — see `ARCHITECTURE.md` §1.

## Requirements

Node.js **≥ 22.5** (needed for `node:sqlite`).

## Running it

```bash
cd server
cp .env.example .env      # at minimum, review SESSION_SECRET
npm run seed               # seeds the 5 packages + sample neighborhoods
npm run dev                 # starts on http://localhost:4000
```

Open `http://localhost:4000` — the same process serves the frontend
(`index.html`, `pages/`, `css/`, `js/`) and the API (`/api/*`).

Run the test suite:
```bash
cd server
npm test
```

## Try the critical flow

1. `http://localhost:4000/pages/register.html` — create an account
2. `http://localhost:4000/pages/projects.html` — pick a package, place an
   order (uses a development test-payment simulator — see below)
3. `http://localhost:4000/pages/dashboard.html` — see the order and the
   newly provisioned system
4. `http://localhost:4000/pages/controller.html` — live-ish telemetry
   (see "About the simulators" below)

## About the simulators

Two things are intentionally simulated, and clearly labeled as such in the UI:

1. **Payment** — the default payment adapter is a test simulator that always succeeds.
2. **Telemetry** — the controller page uses a simulator that generates realistic solar production data.

See the docs in this repo for full details.
