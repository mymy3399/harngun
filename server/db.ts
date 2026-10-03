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

    -- Optimized Indexes for high volumes of expenses & fast aggregation
    CREATE INDEX IF NOT EXISTS idx_members_trip ON members(trip_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_payer ON expenses(paid_by_id);
    CREATE INDEX IF NOT EXISTS idx_splits_expense ON expense_splits(expense_id);
    CREATE INDEX IF NOT EXISTS idx_splits_member ON expense_splits(member_id);
    CREATE INDEX IF NOT EXISTS idx_settlements_trip ON settlements(trip_id, settled_at DESC);
    CREATE INDEX IF NOT EXISTS idx_settlements_pair ON settlements(from_member_id, to_member_id);
    CREATE INDEX IF NOT EXISTS idx_logs_trip ON activity_logs(trip_id, created_at DESC);
  `);
}
