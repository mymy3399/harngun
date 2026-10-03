import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'harbgun.db');

export const db = new Database(DB_PATH);

// High-performance PRAGMAs for fast writes and queries
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      name TEXT NOT NULL,
      promptpay TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      base_amount REAL NOT NULL,
      has_sc INTEGER DEFAULT 0,
      has_vat INTEGER DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_by_id TEXT NOT NULL,
      split_type TEXT NOT NULL,
      receipt_image TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY(paid_by_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      amount REAL NOT NULL,
      share_count REAL DEFAULT 1,
      FOREIGN KEY(expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      from_member_id TEXT NOT NULL,
      to_member_id TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      settled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY(from_member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(to_member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      salt TEXT,
      name TEXT NOT NULL,
      picture TEXT,
      promptpay TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Optimized Indexes for high volumes of expenses, sessions & fast aggregation
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_members_trip ON members(trip_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_payer ON expenses(paid_by_id);
    CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
    CREATE INDEX IF NOT EXISTS idx_splits_member ON expense_splits(member_id);
    CREATE INDEX IF NOT EXISTS idx_settlements_trip ON settlements(trip_id, settled_at DESC);
    CREATE INDEX IF NOT EXISTS idx_settlements_pair ON settlements(from_member_id, to_member_id);
    CREATE INDEX IF NOT EXISTS idx_logs_trip ON activity_logs(trip_id, created_at DESC);
  `);

  // Migrations for existing database
  const safeAlter = (sql: string) => {
    try {
      db.exec(sql);
    } catch (e) {
      // Column already exists or error ignored
    }
  };

  safeAlter(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
  safeAlter(`ALTER TABLE users ADD COLUMN salt TEXT`);
  safeAlter(`ALTER TABLE users ADD COLUMN promptpay TEXT`);
  safeAlter(`ALTER TABLE members ADD COLUMN user_id TEXT`);
  safeAlter(`ALTER TABLE members ADD COLUMN role TEXT DEFAULT 'member'`);
  safeAlter(`ALTER TABLE trips ADD COLUMN creator_user_id TEXT`);
  safeAlter(`ALTER TABLE trips ADD COLUMN invite_code TEXT`);

  safeAlter(`CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_invite ON trips(invite_code)`);
  safeAlter(`CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id)`);

  // Ensure all existing trips have an invite_code
  const tripsWithoutCode = db.prepare("SELECT id FROM trips WHERE invite_code IS NULL OR invite_code = ''").all() as { id: string }[];
  if (tripsWithoutCode.length > 0) {
    const updateCode = db.prepare('UPDATE trips SET invite_code = ? WHERE id = ?');
    for (const t of tripsWithoutCode) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      updateCode.run(code, t.id);
    }
  }
}
