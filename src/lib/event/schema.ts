// SQLite schema & seed data for Event Management
// Used as fallback when offline / on Vercel

export const eventSchemaSql = `
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT DEFAULT 'other',
    status TEXT DEFAULT 'planning',
    description TEXT DEFAULT '',
    pic TEXT DEFAULT 'Wapiq Rizya Zaelan',
    instagram TEXT DEFAULT '@fragrantions',
    start_date TEXT,
    end_date TEXT,
    location TEXT DEFAULT '',
    venue TEXT DEFAULT '',
    budget REAL DEFAULT 0,
    actual_cost REAL DEFAULT 0,
    revenue REAL DEFAULT 0,
    tenant_count INTEGER DEFAULT 0,
    sponsor_count INTEGER DEFAULT 0,
    attendee_target INTEGER DEFAULT 0,
    attendee_actual INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created TEXT DEFAULT (datetime('now')),
    updated TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS event_budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    planned_amount REAL DEFAULT 0,
    actual_amount REAL DEFAULT 0,
    notes TEXT DEFAULT '',
    created TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS event_tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    contact_person TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    booth_number TEXT DEFAULT '',
    booth_size TEXT DEFAULT '',
    package_type TEXT DEFAULT 'basic',
    fee REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    payment_amount REAL DEFAULT 0,
    contract_date TEXT,
    notes TEXT DEFAULT '',
    created TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS event_sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    tier TEXT DEFAULT 'bronze',
    sponsorship_amount REAL DEFAULT 0,
    in_kind INTEGER DEFAULT 0,
    in_kind_description TEXT DEFAULT '',
    in_kind_value REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    contract_date TEXT,
    logo_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS event_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    milestone TEXT NOT NULL,
    due_date TEXT,
    completed INTEGER DEFAULT 0,
    completed_date TEXT,
    notes TEXT DEFAULT '',
    created TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
  CREATE INDEX IF NOT EXISTS idx_event_budget_event ON event_budget(event_id);
  CREATE INDEX IF NOT EXISTS idx_event_tenants_event ON event_tenants(event_id);
  CREATE INDEX IF NOT EXISTS idx_event_sponsors_event ON event_sponsors(event_id);
  CREATE INDEX IF NOT EXISTS idx_event_timeline_event ON event_timeline(event_id);
`;

export const eventSeedSql = `
  -- Initial seed: Fragrantions 2026 (Planning)
  INSERT OR IGNORE INTO events (id, name, slug, type, status, description, pic, instagram, start_date, end_date, location, venue, budget, actual_cost, revenue, tenant_count, sponsor_count, attendee_target, attendee_actual, notes)
  VALUES ('evt-fragrantions-2026', 'Fragrantions 2026', 'fragrantions-2026', 'festival', 'planning', 'Parfum festival tahunan Indonesia — mempertemukan kreator, brand, dan pecinta parfum', 'Wapiq Rizya Zaelan', '@fragrantions', '2026-08-01', '2026-08-03', 'Jakarta', 'TBA', 500000000, 0, 0, 0, 0, 5000, 0, 'Event tahunan utama SWI. Road to Fragrantions dimulai Juni 2026.');

  -- Timeline milestones for Fragrantions 2026
  INSERT OR IGNORE INTO event_timeline (event_id, phase, milestone, due_date, completed)
  VALUES
    ('evt-fragrantions-2026', 'Konsep', 'Finalisasi konsep & tema', '2026-01-31', 1),
    ('evt-fragrantions-2026', 'Venue Booking', 'Booking venue & DP', '2026-03-31', 0),
    ('evt-fragrantions-2026', 'Sponsorship', 'Proposal sponsorship terkirim', '2026-04-30', 0),
    ('evt-fragrantions-2026', 'Tenant', 'Pembukaan pendaftaran tenant', '2026-05-15', 0),
    ('evt-fragrantions-2026', 'Marketing', 'Launch kampanye marketing', '2026-06-01', 0),
    ('evt-fragrantions-2026', 'Road to Fragrantions', 'Pop-up events di kota besar', '2026-06-30', 0),
    ('evt-fragrantions-2026', 'Final Preparation', 'Technical meeting & rehearsal', '2026-07-25', 0),
    ('evt-fragrantions-2026', 'Event Day', 'Fragrantions 2026 berlangsung', '2026-08-01', 0),
    ('evt-fragrantions-2026', 'Settlement', 'Pembayaran tenant & sponsor selesai', '2026-08-15', 0);
`;
