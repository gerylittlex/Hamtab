import { db } from "../db.js";
import { hashPassword, verifyPassword, issueToken, newId } from "../crypto-utils.js";
import { requireAuth, getUserFromRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { email, password, str, optionalStr } from "../validate.js";
import { HttpError } from "../router.js";

const limiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "auth:" });

export function registerAuthRoutes(router) {
  router.post("/api/auth/register", async (req, res) => {
    limiter(req);
    const name = str(req.body, "name", { min: 2, max: 100 });
    const em = email(req.body);
    const pw = password(req.body);
    const phone = optionalStr(req.body, "phone", { max: 20 });

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(em);
    if (existing) throw new HttpError(409, "Email already registered");

    const { hash, salt } = hashPassword(pw);
    const id = newId("usr");
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, password_salt, phone, role, token_version) VALUES (?, ?, ?, ?, ?, ?, 'USER', 0)"
    ).run(id, name, em, hash, salt, phone || null);

    const user = db.prepare("SELECT id, name, email, phone, role FROM users WHERE id = ?").get(id);
    const token = issueToken(id, 0);
    res.json(201, { token, user });
  });

  router.post("/api/auth/login", async (req, res) => {
    limiter(req);
    const em = email(req.body);
    const pw = password(req.body);

    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(em);
    if (!row || !verifyPassword(pw, row.password_salt, row.password_hash)) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = issueToken(row.id, row.token_version);
    const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role };
    res.json(200, { token, user });
  });

  router.post("/api/auth/logout-everywhere", async (req, res) => {
    const user = requireAuth(req);
    db.prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?").run(user.id);
    res.json(200, { ok: true });
  });

  router.get("/api/auth/me", async (req, res) => {
    const user = getUserFromRequest(req);
    res.json(200, { user });
  });
}
