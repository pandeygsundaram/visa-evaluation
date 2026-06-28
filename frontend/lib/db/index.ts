import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var __sqlite: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__sqlite) {
    const dbPath =
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), 'data', 'database.sqlite');

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    runMigrations(db);
    global.__sqlite = db;
  }
  return global.__sqlite;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      provider TEXT NOT NULL DEFAULT 'credentials',
      google_id TEXT UNIQUE,
      stripe_customer_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tier TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      billing_period TEXT NOT NULL,
      call_limit INTEGER NOT NULL,
      model_access_gpt4o_mini INTEGER NOT NULL DEFAULT 1,
      model_access_gpt4o INTEGER NOT NULL DEFAULT 0,
      features TEXT NOT NULL DEFAULT '[]',
      stripe_price_id TEXT,
      stripe_product_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES plans(id),
      stripe_customer_id TEXT NOT NULL,
      stripe_subscription_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      status TEXT NOT NULL DEFAULT 'incomplete',
      current_period_start INTEGER NOT NULL,
      current_period_end INTEGER NOT NULL,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      canceled_at INTEGER,
      calls_used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      country TEXT NOT NULL,
      visa_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      documents TEXT NOT NULL DEFAULT '[]',
      evaluation_result TEXT,
      processed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
  `);
}
