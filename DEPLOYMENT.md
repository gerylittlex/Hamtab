# DEPLOYMENT.md

## Local development

```bash
cd server
cp .env.example .env
npm run seed
npm run dev
```

## Production checklist

1. Set real environment variables (`server/.env`):
   - `NODE_ENV=production`
   - `SESSION_SECRET` — long random value
   - `ENABLE_TELEMETRY_SIMULATOR=false`
   - Optional: real payment provider
2. `npm run seed` once against the production database.
3. Run behind a reverse proxy that terminates TLS.
4. Process manager: systemd, pm2, or container.
5. Back up `server/data/hamtab.db` on a schedule.
