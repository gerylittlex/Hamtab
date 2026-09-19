import { db } from "./src/db.js";
import { hashPassword, newId } from "./src/crypto-utils.js";

console.log("Seeding HamTab database...");

// Clear existing data for clean seed (dev only)
db.exec(`
  DELETE FROM neighborhood_members;
  DELETE FROM neighborhoods;
  DELETE FROM notifications;
  DELETE FROM telemetry;
  DELETE FROM solar_systems;
  DELETE FROM payments;
  DELETE FROM orders;
  DELETE FROM solar_calculations;
  DELETE FROM packages;
  DELETE FROM users WHERE email != 'admin@hamtab.local';
`);

// Admin user
const adminHash = hashPassword("Admin123!");
const adminId = newId("usr");
try {
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, password_salt, role, token_version)
    VALUES (?, 'Admin', 'admin@hamtab.local', ?, ?, 'ADMIN', 0)
  `).run(adminId, adminHash.hash, adminHash.salt);
} catch (e) {
  // already exists
}

// Packages
const packages = [
  { id: "pkg_starter", name: "پکیج استارتر", capacity_kw: 3, price: 45000000, panels: 8, battery_kwh: 5, description: "مناسب آپارتمان‌های کوچک" },
  { id: "pkg_family", name: "پکیج خانوادگی", capacity_kw: 5, price: 72000000, panels: 14, battery_kwh: 10, description: "مناسب خانه‌های ویلایی" },
  { id: "pkg_pro", name: "پکیج حرفه‌ای", capacity_kw: 8, price: 110000000, panels: 22, battery_kwh: 15, description: "مناسب کسب‌وکارهای کوچک" },
  { id: "pkg_business", name: "پکیج تجاری", capacity_kw: 15, price: 195000000, panels: 40, battery_kwh: 30, description: "مناسب کارگاه و فروشگاه" },
  { id: "pkg_enterprise", name: "پکیج سازمانی", capacity_kw: 30, price: 360000000, panels: 80, battery_kwh: 60, description: "مناسب کارخانه‌ها و مجتمع‌ها" },
];

const insertPkg = db.prepare(`
  INSERT INTO packages (id, name, capacity_kw, price, panels, battery_kwh, description, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
`);
for (const p of packages) {
  insertPkg.run(p.id, p.name, p.capacity_kw, p.price, p.panels, p.battery_kwh, p.description);
}

// Sample neighborhoods
const neighborhoods = [
  { id: "nbh_1", name: "محله خورشیدی ونک", location: "تهران، ونک", homes: 24, interested: 18 },
  { id: "nbh_2", name: "محله سبز سعادت‌آباد", location: "تهران، سعادت‌آباد", homes: 40, interested: 22 },
  { id: "nbh_3", name: "محله انرژی پاسداران", location: "تهران، پاسداران", homes: 16, interested: 9 },
];

const insertNbh = db.prepare(`
  INSERT INTO neighborhoods (id, name, location, target_homes, interested_homes, created_by)
  VALUES (?, ?, ?, ?, ?, ?)
`);
for (const n of neighborhoods) {
  insertNbh.run(n.id, n.name, n.location, n.homes, n.interested, adminId);
}

console.log("Seed complete.");
console.log("Admin login: admin@hamtab.local / Admin123!");
