import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../router.js";

export function registerNotificationRoutes(router) {
  router.get("/api/notifications", async (req, res) => {
    const user = requireAuth(req);
    const notifications = db
      .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
      .all(user.id);
    res.json(200, { notifications });
  });

  router.post("/api/notifications/:id/read", async (req, res) => {
    const user = requireAuth(req);
    const row = db.prepare("SELECT * FROM notifications WHERE id = ?").get(req.params.id);
    if (!row) throw new HttpError(404, "Notification not found");
    if (row.user_id !== user.id) throw new HttpError(403, "Forbidden");
    db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json(200, { ok: true });
  });
}
