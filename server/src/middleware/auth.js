import { db } from "../db.js";
import { verifyToken } from "../crypto-utils.js";
import { HttpError } from "../router.js";

const getUserStmt = db.prepare(
  "SELECT id, name, email, phone, address, install_location, role, token_version FROM users WHERE id = ?"
);

export function getUserFromRequest(req) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = getUserStmt.get(payload.uid);
  if (!user) return null;
  if (user.token_version !== payload.tv) return null;
  return user;
}

export function requireAuth(req) {
  const user = getUserFromRequest(req);
  if (!user) throw new HttpError(401, "Authentication required");
  req.user = user;
  return user;
}

export function requireAdmin(req) {
  const user = requireAuth(req);
  if (user.role !== "ADMIN") throw new HttpError(403, "Admin access required");
  return user;
}
