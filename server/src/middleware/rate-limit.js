import { HttpError } from "../router.js";

const buckets = new Map();

export function rateLimit({ windowMs = 60_000, max = 20, keyPrefix = "" } = {}) {
  return function limiter(req) {
    const ip = req.socket.remoteAddress || "unknown";
    const key = keyPrefix + ip;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      throw new HttpError(429, "Too many requests, please try again later");
    }
  };
}
