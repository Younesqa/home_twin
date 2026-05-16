import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../../../database.sqlite");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
    runMigrations(_db);
    seedAdmin(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      area TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS home_setups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      home_type TEXT,
      room_count INTEGER,
      family_size TEXT,
      bill_level TEXT,
      has_battery INTEGER DEFAULT 0,
      battery_capacity REAL,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      type TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      type TEXT NOT NULL,
      is_on INTEGER DEFAULT 0,
      is_essential INTEGER DEFAULT 0,
      is_heavy INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message_ar TEXT NOT NULL,
      message_en TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS modes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      active_mode TEXT DEFAULT 'normal',
      battery_active INTEGER DEFAULT 0,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      reply TEXT,
      replied_by INTEGER,
      created_at TEXT NOT NULL,
      replied_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(replied_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      type TEXT NOT NULL DEFAULT 'current',
      month TEXT NOT NULL,
      created_at TEXT NOT NULL,
      paid_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS solar_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      available_kwh REAL NOT NULL DEFAULT 0,
      rate_per_kwh REAL NOT NULL DEFAULT 0.60,
      generation_per_minute REAL NOT NULL DEFAULT 0.05,
      last_updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}

function runMigrations(db: Database.Database) {
  try {
    db.exec("ALTER TABLE home_setups ADD COLUMN has_solar INTEGER DEFAULT 0");
  } catch {
    // Column already exists — safe to ignore
  }
}

function seedAdmin(db: Database.Database) {
  const existing = db.prepare("SELECT id FROM users WHERE name = 'admin'").get() as { id: number; password_hash: string } | undefined;
  if (!existing) {
    const hash = bcrypt.hashSync("admin", 10);
    db.prepare(
      "INSERT INTO users (name, area, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run("admin", "الخليل", hash, "admin", new Date().toISOString());
  } else {
    // Ensure existing admin password is "admin" (migrate from old "admin123" seed).
    const isOldPassword = bcrypt.compareSync("admin123", (existing as unknown as { password_hash: string }).password_hash);
    if (isOldPassword) {
      const hash = bcrypt.hashSync("admin", 10);
      db.prepare("UPDATE users SET password_hash = ? WHERE name = 'admin'").run(hash);
    }
  }
}

export function getDeviceMeta(type: string): { isEssential: number; isHeavy: number } {
  const essentials = new Set(["light", "fridge", "wifi", "phone"]);
  const heavy = new Set(["ac", "heater", "washingMachine"]);
  return {
    isEssential: essentials.has(type) ? 1 : 0,
    isHeavy: heavy.has(type) ? 1 : 0,
  };
}

export function addLog(userId: number, messageAr: string, messageEn: string) {
  const db = getDb();
  db.prepare(
    "INSERT INTO activity_logs (user_id, message_ar, message_en, created_at) VALUES (?, ?, ?, ?)"
  ).run(userId, messageAr, messageEn, new Date().toISOString());
}
