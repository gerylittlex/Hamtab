import { db } from "../db.js";

let intervalId = null;

export function startTelemetrySimulator({ intervalMs = 5000 } = {}) {
  if (intervalId) return;
  console.log(`[telemetry-simulator] starting (every ${intervalMs}ms)`);
  intervalId = setInterval(() => {
    try {
      const systems = db.prepare("SELECT id, capacity_kw, battery_percent FROM solar_systems WHERE status = 'ACTIVE'").all();
      const insert = db.prepare(`
        INSERT INTO telemetry (system_id, solar_production_kw, home_consumption_kw, battery_percent, grid_usage_kw)
        VALUES (?, ?, ?, ?, ?)
      `);
      const hour = new Date().getHours();
      const sunFactor = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;

      for (const sys of systems) {
        const production = +(sys.capacity_kw * sunFactor * (0.7 + Math.random() * 0.3)).toFixed(2);
        const consumption = +(1.5 + Math.random() * 2).toFixed(2);
        let battery = sys.battery_percent ?? 50;
        battery = Math.max(5, Math.min(100, battery + (production - consumption) * 0.5));
        const grid = Math.max(0, consumption - production);
        insert.run(sys.id, production, consumption, +battery.toFixed(1), +grid.toFixed(2));
        db.prepare("UPDATE solar_systems SET battery_percent = ? WHERE id = ?").run(+battery.toFixed(1), sys.id);
      }
    } catch (err) {
      console.error("[telemetry-simulator]", err.message);
    }
  }, intervalMs);
}
