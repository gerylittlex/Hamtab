# DATABASE.md

SQLite database used by the HamTab backend. Schema is created automatically on first run (see `server/src/db.js`).

## Tables

- users
- packages
- orders
- payments
- solar_systems
- telemetry
- notifications
- neighborhoods
- neighborhood_members
- solar_calculations

Foreign keys and unique constraints are enforced. WAL mode is used. See source for exact column definitions and indexes.

## Backups

Back up the single file `server/data/hamtab.db` (and related -wal/-shm if present) regularly.
