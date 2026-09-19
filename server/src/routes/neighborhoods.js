import { db } from "../db.js";
import { requireAuth, getUserFromRequest } from "../middleware/auth.js";
import { str, number } from "../validate.js";
import { newId } from "../crypto-utils.js";
import { HttpError } from "../router.js";

export function registerNeighborhoodRoutes(router) {
  router.get("/api/neighborhoods", async (req, res) => {
    const user = getUserFromRequest(req);
    const list = db.prepare("SELECT * FROM neighborhoods ORDER BY created_at DESC").all();
    if (user) {
      const joined = new Set(
        db.prepare("SELECT neighborhood_id FROM neighborhood_members WHERE user_id = ?").all(user.id)
          .map((r) => r.neighborhood_id)
      );
      list.forEach((n) => (n.joined = joined.has(n.id)));
    }
    res.json(200, { neighborhoods: list });
  });

  router.get("/api/neighborhoods/activity", async (req, res) => {
    // Simple activity feed from recent joins / creates would go here
    res.json(200, { activity: [] });
  });

  router.post("/api/neighborhoods", async (req, res) => {
    const user = requireAuth(req);
    const name = str(req.body, "name", { min: 3, max: 100 });
    const location = str(req.body, "location", { required: false, max: 200 });
    const homes = number(req.body, "homes", { required: false, min: 1 });
    const interested = number(req.body, "interestedHomes", { required: false, min: 0 });

    const id = newId("nbh");
    db.prepare(`INSERT INTO neighborhoods (id, name, location, target_homes, interested_homes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)`).run(id, name, location || null, homes || null, interested || 0, user.id);
    db.prepare("INSERT INTO neighborhood_members (neighborhood_id, user_id) VALUES (?, ?)").run(id, user.id);

    const neighborhood = db.prepare("SELECT * FROM neighborhoods WHERE id = ?").get(id);
    res.json(201, { neighborhood });
  });

  router.post("/api/neighborhoods/:id/join", async (req, res) => {
    const user = requireAuth(req);
    const nbh = db.prepare("SELECT * FROM neighborhoods WHERE id = ?").get(req.params.id);
    if (!nbh) throw new HttpError(404, "Neighborhood not found");

    try {
      db.prepare("INSERT INTO neighborhood_members (neighborhood_id, user_id) VALUES (?, ?)").run(nbh.id, user.id);
      db.prepare("UPDATE neighborhoods SET interested_homes = interested_homes + 1 WHERE id = ?").run(nbh.id);
    } catch (e) {
      if (String(e.message).includes("UNIQUE")) throw new HttpError(409, "Already joined");
      throw e;
    }

    const updated = db.prepare("SELECT * FROM neighborhoods WHERE id = ?").get(nbh.id);
    res.json(200, { neighborhood: updated });
  });
}
