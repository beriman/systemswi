// SQLite schema for Customer 360 module
// Used as primary data store (with Google Sheets sync)

export const customerSchemaSql = `
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
`;
