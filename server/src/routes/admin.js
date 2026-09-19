// ==========================================================================
// HamTab — Admin API (requireAdmin on every route)
// ==========================================================================
import { db } from "../db.js";
import { HttpError } from "../router.js";
import { requireAdmin } from "../middleware/auth.js";
import { str, number } from "../validate.js";
import { newId } from "../crypto-utils.js";

export function registerAdminRoutes(router) {
  router.get("/api/admin/stats", async (req, res) => {
    requireAdmin(req);
    const users = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const orders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
    const systems = db.prepare("SELECT COUNT(*) as c FROM solar_systems").get().c;
    const packages = db.prepare("SELECT COUNT(*) as c FROM packages").get().c;
    res.json(200, { users, orders, systems, packages });
  });

  router.get("/api/admin/users", async (req, res) => {
    requireAdmin(req);
    const users = db.prepare("SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 500").all();
    res.json(200, { users });
  });

  router.put("/api/admin/users/:id/role", async (req, res) => {
    requireAdmin(req);
    const role = str(req.body, "role");
    if (!["USER", "ADMIN"].includes(role)) throw new HttpError(400, "Invalid role");
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json(200, { ok: true });
  });

  router.get("/api/admin/packages", async (req, res) => {
    requireAdmin(req);
    const packages = db.prepare("SELECT * FROM packages ORDER BY price").all();
    res.json(200, { packages });
  });

  router.post("/api/admin/packages", async (req, res) => {
    requireAdmin(req);
    const name = str(req.body, "name");
    const capacity_kw = number(req.body, "capacity_kw", { min: 0.1 });
    const price = number(req.body, "price", { min: 0 });
    const id = newId("pkg");
    db.prepare(`INSERT INTO packages (id, name, capacity_kw, price, status) VALUES (?, ?, ?, ?, 'ACTIVE')`)
      .run(id, name, capacity_kw, price);
    const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(id);
    res.json(201, { package: pkg });
  });

  router.get("/api/admin/orders", async (req, res) => {
    requireAdmin(req);
    const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").all();
    res.json(200, { orders });
  });
}
