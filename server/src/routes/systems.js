import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../router.js";

export function registerSystemRoutes(router) {
  router.get("/api/systems", async (req, res) => {
    const user = requireAuth(req);
    const systems = db.prepare("SELECT * FROM solar_systems WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
    res.json(200, { systems });
  });

  router.get("/api/systems/:id/controller", async (req, res) => {
    const user = requireAuth(req);
    const system = db.prepare("SELECT * FROM solar_systems WHERE id = ?").get(req.params.id);
    if (!system) throw new HttpError(404, "System not found");
    if (system.user_id !== user.id) throw new HttpError(403, "Forbidden");

    const latest = db.prepare("SELECT * FROM telemetry WHERE system_id = ? ORDER BY recorded_at DESC LIMIT 1").get(system.id);
    let connection = "UNKNOWN";
    if (latest) {
      const ageMs = Date.now() - new Date(latest.recorded_at + "Z").getTime();
      if (ageMs < 15000) connection = "LIVE";
      else if (ageMs < 60000) connection = "STALE";
      else connection = "DISCONNECTED";
    }

    const modes = system.modes_json ? JSON.parse(system.modes_json) : {
      batteryUsage: true, energySaving: false, gridPriority: false, solarPriority: true, batteryReserve: 20
    };

    res.json(200, {
      state: latest || null,
      connection,
      hourlyProductionKw: latest?.solar_production_kw || 0,
      capacityKw: system.capacity_kw,
      modes,
      componentHealth: { inverter: "OK", battery: "OK", panels: "OK" },
    });
  });

  router.put("/api/systems/:id/modes", async (req, res) => {
    const user = requireAuth(req);
    const system = db.prepare("SELECT * FROM solar_systems WHERE id = ?").get(req.params.id);
    if (!system) throw new HttpError(404, "System not found");
    if (system.user_id !== user.id) throw new HttpError(403, "Forbidden");

    const current = system.modes_json ? JSON.parse(system.modes_json) : {};
    const updated = { ...current, ...req.body };
    db.prepare("UPDATE solar_systems SET modes_json = ? WHERE id = ?").run(JSON.stringify(updated), system.id);
    res.json(200, { modes: updated });
  });

  router.post("/api/systems/:id/ingest", async (req, res) => {
    const user = requireAuth(req);
    const system = db.prepare("SELECT * FROM solar_systems WHERE id = ?").get(req.params.id);
    if (!system) throw new HttpError(404, "System not found");
    if (system.user_id !== user.id) throw new HttpError(403, "Forbidden");

    const { solarProductionKw, homeConsumptionKw, batteryPercent, gridUsageKw } = req.body;
    db.prepare(`INSERT INTO telemetry (system_id, solar_production_kw, home_consumption_kw, battery_percent, grid_usage_kw)
      VALUES (?, ?, ?, ?, ?)`).run(system.id, solarProductionKw, homeConsumptionKw, batteryPercent, gridUsageKw);
    if (batteryPercent != null) {
      db.prepare("UPDATE solar_systems SET battery_percent = ? WHERE id = ?").run(batteryPercent, system.id);
    }
    res.json(201, { ok: true });
  });
}
