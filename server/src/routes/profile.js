import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { hashPassword, verifyPassword } from "../crypto-utils.js";
import { str, optionalStr, password } from "../validate.js";
import { HttpError } from "../router.js";

export function registerProfileRoutes(router) {
  router.put("/api/profile", async (req, res) => {
    const user = requireAuth(req);
    const name = str(req.body, "name", { min: 2, max: 100 });
    const phone = optionalStr(req.body, "phone", { max: 20 });
    const address = optionalStr(req.body, "address", { max: 300 });
    const installLocation = optionalStr(req.body, "installLocation", { max: 200 });

    db.prepare(
      "UPDATE users SET name = ?, phone = ?, address = ?, install_location = ? WHERE id = ?"
    ).run(name, phone || null, address || null, installLocation || null, user.id);

    const updated = db
      .prepare("SELECT id, name, email, phone, address, install_location, role FROM users WHERE id = ?")
      .get(user.id);
    res.json(200, { user: updated });
  });

  router.put("/api/profile/password", async (req, res) => {
    const user = requireAuth(req);
    const current = password(req.body, "currentPassword");
    const next = password(req.body, "newPassword");

    const row = db.prepare("SELECT password_hash, password_salt FROM users WHERE id = ?").get(user.id);
    if (!verifyPassword(current, row.password_salt, row.password_hash)) {
      throw new HttpError(401, "Current password is incorrect");
    }

    const { hash, salt } = hashPassword(next);
    db.prepare(
      "UPDATE users SET password_hash = ?, password_salt = ?, token_version = token_version + 1 WHERE id = ?"
    ).run(hash, salt, user.id);

    res.json(200, { ok: true });
  });
}
