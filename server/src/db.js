import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isTest = process.env.NODE_ENV === "test";
const DB_PATH = isTest
  ? ":memory:"
  : process.env.DB_PATH || path.join(__dirname, "../data/hamtab.db");

if (!isTest && DB_PATH !== ":memory:") {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  install_location TEXT,
  role TEXT NOT NULL DEFAULT 'USER',
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity_kw REAL NOT NULL,
  price INTEGER NOT NULL,
  panels INTEGER,
  battery_kwh REAL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  package_id TEXT NOT NULL REFERENCES packages(id),
  package_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  amount INTEGER NOT NULL,
  raw_response TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS solar_systems (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  order_id TEXT REFERENCES orders(id),
  package_id TEXT,
  package_name TEXT,
  capacity_kw REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  installed_on TEXT,
  battery_percent REAL DEFAULT 50,
  modes_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  system_id TEXT NOT NULL REFERENCES solar_systems(id),
  solar_production_kw REAL,
  home_consumption_kw REAL,
  battery_percent REAL,
  grid_usage_kw REAL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS neighborhoods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  target_homes INTEGER,
  interested_homes INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS neighborhood_members (
  neighborhood_id TEXT NOT NULL REFERENCES neighborhoods(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (neighborhood_id, user_id)
);

CREATE TABLE IF NOT EXISTS solar_calculations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  monthly_bill REAL,
  monthly_usage REAL,
  roof_area REAL,
  independence REAL,
  recommended_capacity_kw REAL,
  suggested_package_id TEXT,
  result_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
