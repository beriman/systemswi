// Seed script for Customer 360 module
// Run: npx tsx src/lib/customer/seed.ts (or via the seed API endpoint)

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), ".data");
const dbPath = path.join(dbDir, "systemswi.db");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp TEXT DEFAULT '',
    segment TEXT DEFAULT 'new',
    interest TEXT DEFAULT 'TBA',
    source TEXT DEFAULT 'TBA',
    consent TEXT DEFAULT 'TBA',
    last_contact TEXT DEFAULT 'TBA',
    total_purchases INTEGER DEFAULT 0,
    clv REAL DEFAULT 0,
    recommended_formula TEXT DEFAULT 'TBA',
    notes TEXT DEFAULT '',
    updated_at TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS customer_interactions (
    interaction_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    name TEXT DEFAULT '',
    type TEXT DEFAULT 'note',
    channel TEXT DEFAULT 'WhatsApp',
    summary TEXT DEFAULT '',
    value REAL DEFAULT 0,
    follow_up_date TEXT DEFAULT 'TBA',
    pic TEXT DEFAULT 'TBA',
    created_at TEXT DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
  CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);
  CREATE INDEX IF NOT EXISTS idx_interactions_customer ON customer_interactions(customer_id);
`);

// ── Seed Customers (10 sample) ──────────────────────────────────
const customers = [
  // VIP (3)
  { id: "CUST-ANDIKA8821", name: "Andika Pratama", whatsapp: "6281234568821", segment: "vip", interest: "Parfum Oud & Woody", source: "Referral", consent: "yes", last_contact: "2026-06-20", total_purchases: 15, clv: 75000000, recommended_formula: "Oud Al-Malik", notes: "Prefers oud-based fragrances. Birthday: March 15", updated_at: "2026-06-20T10:00:00Z" },
  { id: "CUST-SITI7723", name: "Siti Nurhaliza", whatsapp: "6281345677723", segment: "vip", interest: "Floral & Feminine", source: "Instagram", consent: "yes", last_contact: "2026-06-18", total_purchases: 12, clv: 62000000, recommended_formula: "Rose Elixir", notes: "Loves floral bouquets. Corporate gifting client.", updated_at: "2026-06-18T14:30:00Z" },
  { id: "CUST-BUDI4456", name: "Budi Santoso", whatsapp: "6281567894456", segment: "vip", interest: "Fresh & Aquatic", source: "WhatsApp", consent: "yes", last_contact: "2026-06-22", total_purchases: 18, clv: 95000000, recommended_formula: "Ocean Breeze", notes: "High-value repeat buyer. Prefers fresh scents.", updated_at: "2026-06-22T09:15:00Z" },

  // Regular (4)
  { id: "CUST-DEWI3319", name: "Dewi Lestari", whatsapp: "6281678903319", segment: "regular", interest: "Fruity & Sweet", source: "Instagram", consent: "yes", last_contact: "2026-06-10", total_purchases: 4, clv: 12000000, recommended_formula: "Mango Bliss", notes: "Active on social media. Potential loyal upgrade.", updated_at: "2026-06-10T11:00:00Z" },
  { id: "CUST-RINA5527", name: "Rina Wati", whatsapp: "6281789015527", segment: "regular", interest: "Vanilla & Gourmand", source: "Referral", consent: "yes", last_contact: "2026-06-05", total_purchases: 3, clv: 8500000, recommended_formula: "Vanilla Dream", notes: "Prefers sweet warm scents. Married, 2 kids.", updated_at: "2026-06-05T16:00:00Z" },
  { id: "CUST-JOKO9912", name: "Joko Widodo", whatsapp: "6281890129912", segment: "regular", interest: "Spicy & Oriental", source: "WhatsApp", consent: "yes", last_contact: "2026-06-12", total_purchases: 5, clv: 15000000, recommended_formula: "Spice Route", notes: "Loves exotic spice blends. Follows up regularly.", updated_at: "2026-06-12T13:45:00Z" },
  { id: "CUST-LINA6634", name: "Lina Marlina", whatsapp: "6281901236634", segment: "regular", interest: "Citrus & Fresh", source: "Expo", consent: "TBA", last_contact: "2026-05-28", total_purchases: 3, clv: 7200000, recommended_formula: "Citrus Splash", notes: "Met at Indonesia Perfume Expo 2026.", updated_at: "2026-05-28T10:30:00Z" },

  // New (3)
  { id: "CUST-AYU2247", name: "Ayu Ting Ting", whatsapp: "6281102342247", segment: "new", interest: "TBA", source: "TikTok", consent: "TBA", last_contact: "2026-06-23", total_purchases: 1, clv: 2500000, recommended_formula: "TBA", notes: "First purchase via TikTok Live. Need preference follow-up.", updated_at: "2026-06-23T20:00:00Z" },
  { id: "CUST-REZA8891", name: "Reza Rahardian", whatsapp: "6281213458891", segment: "new", interest: "TBA", source: "Instagram", consent: "no", last_contact: "2026-06-21", total_purchases: 1, clv: 1800000, recommended_formula: "TBA", notes: "Interested but hasn't decided. Do NOT follow up yet.", updated_at: "2026-06-21T17:30:00Z" },
  { id: "CUST-MAYA1178", name: "Maya Sari", whatsapp: "6281324561178", segment: "new", interest: "TBA", source: "Referral", consent: "yes", last_contact: "2026-06-24", total_purchases: 0, clv: 0, recommended_formula: "TBA", notes: "Just registered. Warm lead from Andika referral.", updated_at: "2026-06-24T08:00:00Z" },
];

const insertCustomer = db.prepare(`
  INSERT OR REPLACE INTO customers (id, name, whatsapp, segment, interest, source, consent, last_contact, total_purchases, clv, recommended_formula, notes, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const c of customers) {
  insertCustomer.run(c.id, c.name, c.whatsapp, c.segment, c.interest, c.source, c.consent, c.last_contact, c.total_purchases, c.clv, c.recommended_formula, c.notes, c.updated_at);
}

console.log(`✅ Seeded ${customers.length} customers`);

// ── Seed Interactions (15 sample) ────────────────────────────────
const interactions = [
  // Andika Pratama (VIP)
  { interaction_id: "CI-20260620-001", customer_id: "CUST-ANDIKA8821", name: "Andika Pratama", type: "purchase", channel: "WhatsApp", summary: "Ordered 3x Oud Al-Malik 100ml", value: 4500000, follow_up_date: "2026-07-20", pic: "HemuHemu/OWL", created_at: "2026-06-20T10:00:00Z" },
  { interaction_id: "CI-20260615-001", customer_id: "CUST-ANDIKA8821", name: "Andika Pratama", type: "follow_up", channel: "WhatsApp", summary: "Checked satisfaction after last order", value: 0, follow_up_date: "2026-06-25", pic: "HemuHemu/OWL", created_at: "2026-06-15T09:00:00Z" },

  // Siti Nurhaliza (VIP)
  { interaction_id: "CI-20260618-001", customer_id: "CUST-SITI7723", name: "Siti Nurhaliza", type: "purchase", channel: "WhatsApp", summary: "Corporate gifting order — 20x Rose Elixir", value: 12000000, follow_up_date: "2026-07-18", pic: "HemuHemu/OWL", created_at: "2026-06-18T14:30:00Z" },
  { interaction_id: "CI-20260610-001", customer_id: "CUST-SITI7723", name: "Siti Nurhaliza", type: "note", channel: "WhatsApp", summary: "Mentioned interest in limited edition Valentine collection", value: 0, follow_up_date: "2026-07-14", pic: "HemuHemu/OWL", created_at: "2026-06-10T11:20:00Z" },

  // Budi Santoso (VIP)
  { interaction_id: "CI-20260622-001", customer_id: "CUST-BUDI4456", name: "Budi Santoso", type: "purchase", channel: "WhatsApp", summary: "Bulk order Ocean Breeze for hotel chain", value: 25000000, follow_up_date: "2026-07-22", pic: "HemuHemu/OWL", created_at: "2026-06-22T09:15:00Z" },
  { interaction_id: "CI-20260605-001", customer_id: "CUST-BUDI4456", name: "Budi Santoso", type: "follow_up", channel: "WhatsApp", summary: "Follow-up on hotel partnership proposal", value: 0, follow_up_date: "2026-06-25", pic: "HemuHemu/OWL", created_at: "2026-06-05T14:00:00Z" },

  // Dewi Lestari (Regular)
  { interaction_id: "CI-20260610-002", customer_id: "CUST-DEWI3319", name: "Dewi Lestari", type: "purchase", channel: "Instagram DM", summary: "Purchased Mango Bliss starter kit", value: 1800000, follow_up_date: "2026-07-10", pic: "HemuHemu/OWL", created_at: "2026-06-10T11:00:00Z" },
  { interaction_id: "CI-20260601-001", customer_id: "CUST-DEWI3319", name: "Dewi Lestari", type: "follow_up", channel: "WhatsApp", summary: "Asked about subscription program", value: 0, follow_up_date: "2026-06-20", pic: "HemuHemu/OWL", created_at: "2026-06-01T10:00:00Z" },

  // Rina Wati (Regular)
  { interaction_id: "CI-20260605-002", customer_id: "CUST-RINA5527", name: "Rina Wati", type: "purchase", channel: "WhatsApp", summary: "Ordered Vanilla Dream 50ml", value: 1200000, follow_up_date: "2026-07-05", pic: "HemuHemu/OWL", created_at: "2026-06-05T16:00:00Z" },

  // Joko Widodo (Regular)
  { interaction_id: "CI-20260612-001", customer_id: "CUST-JOKO9912", name: "Joko Widodo", type: "purchase", channel: "WhatsApp", summary: "Spice Route discovery set", value: 2200000, follow_up_date: "2026-07-12", pic: "HemuHemu/OWL", created_at: "2026-06-12T13:45:00Z" },
  { interaction_id: "CI-20260608-001", customer_id: "CUST-JOKO9912", name: "Joko Widodo", type: "note", channel: "WhatsApp", summary: "Interested in custom blend workshop", value: 0, follow_up_date: "2026-06-25", pic: "HemuHemu/OWL", created_at: "2026-06-08T15:00:00Z" },

  // Lina Marlina (Regular)
  { interaction_id: "CI-20260528-001", customer_id: "CUST-LINA6634", name: "Lina Marlina", type: "purchase", channel: "WhatsApp", summary: "Citrus Splash sample pack", value: 750000, follow_up_date: "2026-06-28", pic: "HemuHemu/OWL", created_at: "2026-05-28T10:30:00Z" },

  // Ayu Ting Ting (New)
  { interaction_id: "CI-20260623-001", customer_id: "CUST-AYU2247", name: "Ayu Ting Ting", type: "purchase", channel: "TikTok Live", summary: "First purchase — mystery fragrance box", value: 2500000, follow_up_date: "2026-06-30", pic: "HemuHemu/OWL", created_at: "2026-06-23T20:00:00Z" },
  { interaction_id: "CI-20260623-002", customer_id: "CUST-AYU2247", name: "Ayu Ting Ting", type: "follow_up", channel: "WhatsApp", summary: "Asked about scent preference", value: 0, follow_up_date: "2026-06-26", pic: "HemuHemu/OWL", created_at: "2026-06-23T20:30:00Z" },

  // Reza Rahardian (New)
  { interaction_id: "CI-20260621-001", customer_id: "CUST-REZA8891", name: "Reza Rahardian", type: "note", channel: "Instagram", summary: "Inquired about price range, hesitant", value: 0, follow_up_date: "2026-07-01", pic: "HemuHemu/OWL", created_at: "2026-06-21T17:30:00Z" },

  // Maya Sari (New)
  { interaction_id: "CI-20260624-001", customer_id: "CUST-MAYA1178", name: "Maya Sari", type: "note", channel: "WhatsApp", summary: "Registration via Andika referral. Sent welcome message.", value: 0, follow_up_date: "2026-06-27", pic: "HemuHemu/OWL", created_at: "2026-06-24T08:00:00Z" },
];

const insertInteraction = db.prepare(`
  INSERT OR REPLACE INTO customer_interactions (interaction_id, customer_id, name, type, channel, summary, value, follow_up_date, pic, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const i of interactions) {
  insertInteraction.run(i.interaction_id, i.customer_id, i.name, i.type, i.channel, i.summary, i.value, i.follow_up_date, i.pic, i.created_at);
}

console.log(`✅ Seeded ${interactions.length} interactions`);
console.log("🎉 Customer 360 seed complete!");

db.close();
