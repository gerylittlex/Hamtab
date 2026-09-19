// ==========================================================================
// HamTab — Minimal router
// A small, dependency-free stand-in for Express: enough routing (method +
// path params), JSON body parsing, and a res.json()/res.status() helper.
// ==========================================================================

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function createRouter() {
  const routes = []; // { method, pattern: RegExp, keys: string[], handler }

  function register(method, path, handler) {
    const keys = [];
    const pattern = new RegExp(
      "^" +
        path
          .replace(/\/:[a-zA-Z_]+/g, (m) => {
            keys.push(m.slice(2));
            return "/([^/]+)";
          })
          .replace(/\//g, "\\/") +
        "$"
    );
    routes.push({ method, pattern, keys, handler });
  }

  const router = {
    get: (p, h) => register("GET", p, h),
    post: (p, h) => register("POST", p, h),
    put: (p, h) => register("PUT", p, h),
    patch: (p, h) => register("PATCH", p, h),
    delete: (p, h) => register("DELETE", p, h),
    routes,
  };
  return router;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw new HttpError(413, "Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Malformed JSON body");
  }
}

export function dispatch(router) {
  return async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);

    res.json = (status, payload) => {
      const body = JSON.stringify(payload);
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
      res.end(body);
    };

    for (const route of router.routes) {
      if (route.method !== req.method) continue;
      const match = route.pattern.exec(pathname);
      if (!match) continue;

      const params = {};
      route.keys.forEach((key, i) => (params[key] = match[i + 1]));
      req.params = params;
      req.query = Object.fromEntries(url.searchParams.entries());

      try {
        if (["POST", "PUT", "PATCH"].includes(req.method)) {
          req.body = await readBody(req);
        } else {
          req.body = {};
        }
        await route.handler(req, res);
      } catch (err) {
        if (err instanceof HttpError) {
          res.json(err.status, { error: err.message, details: err.details });
        } else {
          console.error("[unhandled]", err);
          res.json(500, { error: "Internal server error" });
        }
      }
      return true;
    }
    return false; // no route matched
  };
}
