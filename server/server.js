import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRouter, dispatch } from "./src/router.js";
import { registerAuthRoutes } from "./src/routes/auth.js";
import { registerPackageRoutes } from "./src/routes/packages.js";
import { registerSolarRoutes } from "./src/routes/solar.js";
import { registerOrderRoutes } from "./src/routes/orders.js";
import { registerSystemRoutes } from "./src/routes/systems.js";
import { registerNotificationRoutes } from "./src/routes/notifications.js";
import { registerNeighborhoodRoutes } from "./src/routes/neighborhoods.js";
import { registerProfileRoutes } from "./src/routes/profile.js";
import { registerAdminRoutes } from "./src/routes/admin.js";
import { startTelemetrySimulator } from "./src/services/telemetry-simulator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.join(__dirname, ".."); // the hamtab/ directory (index.html, pages/, css/, js/)
const PORT = Number(process.env.PORT) || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

const router = createRouter();
registerAuthRoutes(router);
registerPackageRoutes(router);
registerSolarRoutes(router);
registerOrderRoutes(router);
registerSystemRoutes(router);
registerNotificationRoutes(router);
registerNeighborhoodRoutes(router);
registerProfileRoutes(router);
registerAdminRoutes(router);
const handleApi = dispatch(router);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function securityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'"
  );
  if (NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(FRONTEND_ROOT, pathname === "/" ? "/index.html" : pathname);
  // Prevent path traversal outside FRONTEND_ROOT.
  if (!filePath.startsWith(FRONTEND_ROOT)) {
    res.writeHead(400).end("Bad request");
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);

  if (pathname.startsWith("/api/")) {
    const matched = await handleApi(req, res);
    if (!matched) res.json ? res.json(404, { error: "Not found" }) : res.writeHead(404).end();
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`HamTab server listening on http://localhost:${PORT} (env=${NODE_ENV})`);
  const simulatorEnabled = (process.env.ENABLE_TELEMETRY_SIMULATOR ?? (NODE_ENV !== "production" ? "true" : "false")) === "true";
  if (simulatorEnabled) startTelemetrySimulator({ intervalMs: Number(process.env.TELEMETRY_INTERVAL_MS) || 5000 });
  else console.log("[telemetry-simulator] disabled (ENABLE_TELEMETRY_SIMULATOR=false)");
});
