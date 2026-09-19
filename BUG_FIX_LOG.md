# BUG_FIX_LOG.md

## BUG-001 — Open redirect on auth pages
- **Severity:** High
- **Description:** `login.html` and `register.html` used `?redirect=` query values directly as `location.href`, allowing absolute external URLs.
- **Root cause:** No validation that the redirect target is a same-origin relative `.html` path.
- **Affected files:** `pages/login.html`, `pages/register.html`
- **Fix applied:** Added `safeRedirect()` that rejects `http(s):`, `//`, `..`, and non-`.html` targets; falls back to `dashboard.html`.
- **Verification:** Static code review of redirect path construction; pattern matches relative page names only.
- **Result:** Fixed

## BUG-002 — Non-atomic successful payment path
- **Severity:** High
- **Description:** On pay success, `insertPayment` ran outside the SQLite transaction that marks the order paid and provisions the system. A failure mid-provision could leave a SUCCEEDED payment row with an unpaid order.
- **Root cause:** Payment insert ordered before `BEGIN` for the success branch.
- **Affected files:** `server/src/routes/orders.js`
- **Fix applied:** For SUCCEEDED results, insert payment, update order, insert system, and insert notification inside one `BEGIN`/`COMMIT` transaction. Failed payments still record outside the success transaction.
- **Verification:** Full test suite (11/11 pass), including "paying an order provisions a solar system" and forced-decline cases.
- **Result:** Fixed

## BUG-003 — XSS risk via unescaped `innerHTML`
- **Severity:** Medium
- **Description:** Notification title/body, package names, neighborhood names/activity text, and toast content were interpolated into `innerHTML` without HTML escaping.
- **Root cause:** Trust of server/seed strings; no shared escape helper.
- **Affected files:** `js/components.js`, `js/pages/dashboard.js`, `js/pages/projects.js`, `js/pages/neighborhood.js`
- **Fix applied:** Added `HamTabUI.escapeHtml` and local `esc()` helpers; applied to toasts and dynamic list/card markup.
- **Verification:** Code inspection; tests still pass (UI escaping does not affect API tests).
- **Result:** Fixed (defense in depth; remaining templates should prefer `textContent` where practical)

## BUG-004 — Error toasts not styled as danger
- **Severity:** Low
- **Description:** Page scripts passed `type: "error"` but `showToast` only mapped `danger` → `toast-danger`.
- **Root cause:** Inconsistent type vocabulary between callers and component.
- **Affected files:** `js/components.js`
- **Fix applied:** Map both `error` and `danger` to `toast-danger`.
- **Verification:** Code review of typeClass map.
- **Result:** Fixed

## BUG-005 — Junk empty directory in server tree
- **Severity:** Low
- **Description:** Empty directory literally named `{routes,services,middleware}` under `server/src/`.
- **Root cause:** Shell brace expansion used incorrectly when creating folders.
- **Affected files:** directory only
- **Fix applied:** Removed the directory.
- **Verification:** `ls server/src/`
- **Result:** Fixed

## BUG-006 — DB path inflexibility / overlay FS I/O
- **Severity:** Medium (environment-dependent)
- **Description:** SQLite reported `disk I/O error` under the sandbox overlay when creating the default `server/data/hamtab.db` with WAL; same schema succeeded on `/tmp`.
- **Root cause:** Environment filesystem interaction with SQLite, not application SQL.
- **Affected files:** `server/src/db.js`
- **Fix applied:** Allow `DB_PATH` env override for the non-test database file path.
- **Verification:** Seed + tests with `DB_PATH=/tmp/hamtab-audit.db`.
- **Result:** Mitigated / documented

## BUG-007 — Login/register broken under CSP
- **Severity:** High
- **Description:** Content-Security-Policy used `script-src 'self'` without `'unsafe-inline'`, so inline `<script>` blocks on login.html and register.html never ran; form submit handlers never attached.
- **Root cause:** Auth pages used inline scripts while CSP forbade them.
- **Affected files:** pages/login.html, pages/register.html, index.html, js/pages/login.js (new), js/pages/register.js (new), js/main.js
- **Fix applied:** Moved page logic to external JS files; landing counters moved into main.js.
- **Verification:** login.js and register.js served 200; API login/register succeed; no bare `<script>` tags left on auth pages.
- **Result:** Fixed
