# CHANGELOG.md

## [1.0.0] — Full-stack rebuild

### Added
- Real backend (`server/`): Node built-in `http` router, SQLite database (`node:sqlite`), scrypt+HMAC auth, no external dependencies.
- Real authentication: register, login, `/me`, logout-everywhere, password change.
- Package catalog, solar calculator, orders with payment flow, systems/controller, notifications, neighborhoods.
- Admin panel and routes.
- Comprehensive test suite with `node --test`.
- Full documentation suite (API, Architecture, Security, Deployment, etc.).

### Changed
- Frontend now talks to real API instead of mock data.
- Navigation and auth state driven by real session.

### Fixed
- See BUG_FIX_LOG.md for the list of bugs fixed during the rebuild.
