/**
 * Seed the plans table with free / pro / business plans.
 * Run with: npx tsx scripts/seed-plans.ts
 */
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Make sure tables exist first (run migrations inline)
db.exec(`
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
`);

const plans = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    billingPeriod: 'monthly',
    callLimit: 2,
    gpt4oMini: true,
    gpt4o: false,
    features: ['2 evaluations/month', 'Basic visa types', 'Email support'],
    stripePriceId: null,
    stripeProductId: null,
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 2900, // $29.00
    billingPeriod: 'monthly',
    callLimit: 50,
    gpt4oMini: true,
    gpt4o: false,
    features: ['50 evaluations/month', 'All visa types', 'Priority support', 'API access'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
    stripeProductId: null,
  },
  {
    name: 'Business',
    tier: 'business',
    price: 9900, // $99.00
    billingPeriod: 'monthly',
    callLimit: 500,
    gpt4oMini: true,
    gpt4o: true,
    features: ['500 evaluations/month', 'All visa types', 'Dedicated support', 'API access', 'GPT-4o analysis'],
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || null,
    stripeProductId: null,
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO plans
    (id, name, tier, price, billing_period, call_limit, model_access_gpt4o_mini, model_access_gpt4o,
     features, stripe_price_id, stripe_product_id, is_active, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
`);

const now = Date.now();
for (const p of plans) {
  insert.run(
    uuidv4(), p.name, p.tier, p.price, p.billingPeriod, p.callLimit,
    p.gpt4oMini ? 1 : 0, p.gpt4o ? 1 : 0,
    JSON.stringify(p.features), p.stripePriceId, p.stripeProductId,
    now, now
  );
  console.log(`✅ Seeded plan: ${p.name}`);
}

console.log('\n✅ Plans seeded successfully.');
db.close();
