import { db } from "../db.js";
import { HttpError } from "../router.js";
import { requireAuth } from "../middleware/auth.js";
import { str } from "../validate.js";
import { newId } from "../crypto-utils.js";
import { getPaymentAdapter } from "../services/payment-adapter.js";

export function registerOrderRoutes(router) {
  router.get("/api/orders", async (req, res) => {
    const user = requireAuth(req);
    const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
    res.json(200, { orders });
  });

  router.get("/api/orders/:id", async (req, res) => {
    const user = requireAuth(req);
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) throw new HttpError(404, "Order not found");
    if (order.user_id !== user.id) throw new HttpError(403, "Forbidden");
    res.json(200, { order });
  });

  router.post("/api/orders", async (req, res) => {
    const user = requireAuth(req);
    const packageId = str(req.body, "packageId");
    const address = str(req.body, "address", { required: false, max: 300 });
    const idempotencyKey = req.headers["idempotency-key"] || null;

    if (idempotencyKey) {
      const existing = db.prepare("SELECT * FROM orders WHERE idempotency_key = ?").get(idempotencyKey);
      if (existing) return res.json(200, { order: existing });
    }

    const pkg = db.prepare("SELECT * FROM packages WHERE id = ? AND status = 'ACTIVE'").get(packageId);
    if (!pkg) throw new HttpError(404, "Package not found");

    const id = newId("ord");
    db.prepare(`
      INSERT INTO orders (id, user_id, package_id, package_name, price, address, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, pkg.id, pkg.name, pkg.price, address || null, idempotencyKey);

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    res.json(201, { order });
  });

  router.post("/api/orders/:id/pay", async (req, res) => {
    const user = requireAuth(req);
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) throw new HttpError(404, "Order not found");
    if (order.user_id !== user.id) throw new HttpError(403, "Forbidden");
    if (order.payment_status === "PAID") throw new HttpError(409, "Order already paid");

    const adapter = getPaymentAdapter();
    const result = await adapter.charge({ amount: order.price, orderId: order.id });

    if (result.status === "SUCCEEDED") {
      const paymentId = newId("pay");
      const systemId = newId("sys");
      const notifId = newId("ntf");

      db.exec("BEGIN");
      try {
        db.prepare(`INSERT INTO payments (id, order_id, provider, status, amount, raw_response) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(paymentId, order.id, adapter.name, "SUCCEEDED", order.price, JSON.stringify(result.raw || {}));
        db.prepare(`UPDATE orders SET status = 'CONFIRMED', payment_status = 'PAID', updated_at = datetime('now') WHERE id = ?`)
          .run(order.id);
        const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(order.package_id);
        db.prepare(`INSERT INTO solar_systems (id, user_id, order_id, package_id, package_name, capacity_kw, status, installed_on, battery_percent)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', date('now'), 60)`)
          .run(systemId, user.id, order.id, order.package_id, order.package_name, pkg?.capacity_kw || 5);
        db.prepare(`INSERT INTO notifications (id, user_id, title, body) VALUES (?, ?, ?, ?)`)
          .run(notifId, user.id, "سفارش تأیید شد", `سیستم خورشیدی شما با موفقیت ثبت شد.`);
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }

      const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
      res.json(200, { order: updated, payment: { id: paymentId, status: "SUCCEEDED" } });
    } else {
      db.prepare(`UPDATE orders SET payment_status = 'FAILED', updated_at = datetime('now') WHERE id = ?`).run(order.id);
      throw new HttpError(402, "Payment failed");
    }
  });
}
