// SQLite database singleton for systemswi
// Uses better-sqlite3 for local development
// On Vercel/serverless, falls back to Google Sheets as data source
import * as path from "path";
import * as fs from "fs";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "systemswi.db");
const IS_SERVERLESS = !!process.env.VERCEL;

let db: any = null;

export function getDb() {
  if (IS_SERVERLESS) {
    throw new Error("SQLite not available on Vercel. Use Google Sheets API instead.");
  }

  if (!db) {
    // Dynamic import to avoid loading better-sqlite3 on Vercel
    const Database = require("better-sqlite3");
    
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    seedDatabase(db);
  }
  return db;
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS investors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no INTEGER UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      email TEXT,
      telepon TEXT,
      alamat TEXT,
      nik TEXT,
      npwp TEXT,
      jumlah_saham INTEGER DEFAULT 0,
      nilai_saham REAL DEFAULT 0,
      status TEXT DEFAULT 'aktif',
      kyc_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sukuk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      nilai_sukuk REAL NOT NULL,
      jumlah_unit INTEGER NOT NULL,
      harga_per_unit REAL NOT NULL,
      tenor_bulan INTEGER NOT NULL,
      nisbah_investor REAL NOT NULL,
      nisbah_pengelola REAL NOT NULL,
      jenis_akad TEXT NOT NULL,
      status TEXT DEFAULT 'aktif',
      tanggal_penerbitan TEXT,
      tanggal_jatuh_tempo TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sukuk_investors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sukuk_id INTEGER NOT NULL,
      investor_id INTEGER NOT NULL,
      jumlah_unit INTEGER NOT NULL,
      nilai_investasi REAL NOT NULL,
      tanggal_berlangganan TEXT,
      status TEXT DEFAULT 'aktif',
      FOREIGN KEY (sukuk_id) REFERENCES sukuk(id),
      FOREIGN KEY (investor_id) REFERENCES investors(id)
    );

    CREATE TABLE IF NOT EXISTS profit_distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sukuk_id INTEGER NOT NULL,
      periode TEXT NOT NULL,
      total_profit REAL NOT NULL,
      nisbah_investor REAL NOT NULL,
      nisbah_pengelola REAL NOT NULL,
      jumlah_dibagikan REAL NOT NULL,
      tanggal_pembagian TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (sukuk_id) REFERENCES sukuk(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal TEXT NOT NULL,
      jenis TEXT NOT NULL,
      kategori TEXT NOT NULL,
      deskripsi TEXT,
      jumlah REAL NOT NULL,
      sumber TEXT DEFAULT 'bank',
      referensi TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS production_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_code TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      formula_id INTEGER,
      quantity INTEGER NOT NULL,
      unit TEXT DEFAULT 'botol',
      status TEXT DEFAULT 'planned',
      cost_materials REAL DEFAULT 0,
      cost_labor REAL DEFAULT 0,
      cost_overhead REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(status);
    CREATE INDEX IF NOT EXISTS idx_sukuk_status ON sukuk(status);

    -- Sukuk Mikro Per Produk tables
    CREATE TABLE IF NOT EXISTS sukuk_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      deskripsi TEXT DEFAULT '',
      kategori TEXT DEFAULT 'merchandise',
      harga_per_unit REAL NOT NULL,
      jumlah_unit INTEGER NOT NULL,
      nilai_sukuk REAL NOT NULL,
      tenor_bulan INTEGER NOT NULL,
      nisbah_investor REAL NOT NULL,
      nisbah_pengelola REAL NOT NULL,
      jenis_akad TEXT DEFAULT 'musyarakah',
      target_cogs REAL DEFAULT 0,
      target_harga_jual REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sukuk_investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      investor_name TEXT NOT NULL,
      investor_email TEXT DEFAULT '',
      investor_phone TEXT DEFAULT '',
      jumlah_unit INTEGER NOT NULL,
      nilai_investasi REAL NOT NULL,
      tanggal_investasi TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'aktif',
      consent INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      FOREIGN KEY (product_id) REFERENCES sukuk_products(id)
    );

    CREATE TABLE IF NOT EXISTS sukuk_profit_distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      periode TEXT NOT NULL,
      total_revenue REAL DEFAULT 0,
      total_cogs REAL DEFAULT 0,
      total_profit REAL NOT NULL,
      nisbah_investor REAL NOT NULL,
      nisbah_pengelola REAL NOT NULL,
      jumlah_dibagikan REAL NOT NULL,
      jumlah_per_unit REAL NOT NULL,
      tanggal_pembagian TEXT,
      status TEXT DEFAULT 'draft',
      notes TEXT DEFAULT '',
      FOREIGN KEY (product_id) REFERENCES sukuk_products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sukuk_products_status ON sukuk_products(status);
    CREATE INDEX IF NOT EXISTS idx_sukuk_investments_product ON sukuk_investments(product_id);
    CREATE INDEX IF NOT EXISTS idx_sukuk_investments_status ON sukuk_investments(status);
    CREATE INDEX IF NOT EXISTS idx_sukuk_profit_product ON sukuk_profit_distributions(product_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions(tanggal);
    CREATE INDEX IF NOT EXISTS idx_transactions_jenis ON transactions(jenis);
    CREATE INDEX IF NOT EXISTS idx_production_status ON production_batches(status);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

    -- Event Management tables (Fragrantions — PIC: Wapiq)
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

    -- CRM tables
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      whatsapp TEXT DEFAULT '',
      segment TEXT DEFAULT 'new',
      interest TEXT DEFAULT 'TBA',
      source TEXT DEFAULT 'TBA',
      consent TEXT DEFAULT 'TBA',
      last_contact TEXT,
      total_purchases INTEGER DEFAULT 0,
      clv REAL DEFAULT 0,
      recommended_formula TEXT DEFAULT 'TBA',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interaction_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'note',
      channel TEXT DEFAULT 'WhatsApp',
      summary TEXT DEFAULT '',
      value REAL DEFAULT 0,
      follow_up_date TEXT DEFAULT 'TBA',
      pic TEXT DEFAULT 'TBA',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
    CREATE INDEX IF NOT EXISTS idx_customers_consent ON customers(consent);
    CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_customer_interactions_followup ON customer_interactions(follow_up_date);
  `);
}

function seedDatabase(db: any) {
  const count = db.prepare("SELECT COUNT(*) as c FROM investors").get();
  if (count.c > 0) return;

  const insertInvestor = db.prepare(`
    INSERT INTO investors (no, nama, email, telepon, jumlah_saham, nilai_saham, status, kyc_verified)
    VALUES (?, ?, ?, ?, ?, ?, 'aktif', 1)
  `);

  // Seed investors — data from PemegangSaham sheet
  // Beriman: 850 saham (34%), kewajiban Rp 85M, sudah setor Rp 26.8M
  // Malsiaf: 825 saham (33%), kewajiban Rp 82.5M, sudah setor Rp 6.86M
  // Wapiq: 825 saham (33%), kewajiban Rp 82.5M, sudah setor Rp 6.435M
  insertInvestor.run(1, "Beriman Juliano", "beriman@sensasiwangi.id", "08118556688", 850, 85000000);
  insertInvestor.run(2, "Muhamad Malsiaf", "malsiaf@sensasiwangi.id", "08118556689", 825, 82500000);
  insertInvestor.run(3, "Wapiq Rizya Zaelan", "wapiq@sensasiwangi.id", "08118556690", 825, 82500000);

  // Seed sukuk — data from SukukStore sheet
  db.prepare(`
    INSERT INTO sukuk (kode, nama, nilai_sukuk, jumlah_unit, harga_per_unit, tenor_bulan, nisbah_investor, nisbah_pengelola, jenis_akad, status)
    VALUES ('SWQ-001', 'Sukuk SWI Store TIM', 1000000000, 1000, 1000000, 36, 50, 50, 'musyarakah', 'perencanaan')
  `).run();

  // Seed sukuk mikro products — Batch 1
  const sukukProductCount = db.prepare("SELECT COUNT(*) as c FROM sukuk_products").get();
  if (sukukProductCount.c === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO sukuk_products (kode, nama, deskripsi, kategori, harga_per_unit, jumlah_unit, nilai_sukuk, tenor_bulan, nisbah_investor, nisbah_pengelola, jenis_akad, target_cogs, target_harga_jual, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertProduct.run('SM-001', 'SWI T-Shirt Collection', 'T-Shirt premium cotton dengan desain eksklusif SWI — 3 warna', 'merchandise', 50000, 200, 10000000, 6, 60, 40, 'musyarakah', 25000, 85000, 'open');
    insertProduct.run('SM-002', 'SWI Tumbler Series', 'Tumbler stainless steel 450ml dengan branding SWI — tahan 12 jam dingin', 'merchandise', 75000, 150, 11250000, 6, 60, 40, 'musyarakah', 35000, 120000, 'open');
    insertProduct.run('SM-003', 'SWI Scented Candle', 'Lilin aromaterapi dengan formula eksklusif L\'Arc~en~Scent — 3 varian', 'merchandise', 100000, 100, 10000000, 6, 55, 45, 'musyarakah', 45000, 165000, 'open');
    insertProduct.run('SM-004', 'SWI Tote Bag Canvas', 'Tote bag canvas premium dengan ilustrasi botanical SWI', 'merchandise', 40000, 250, 10000000, 6, 60, 40, 'musyarakah', 18000, 65000, 'open');
    insertProduct.run('SM-005', 'SWI Perfume Discovery Kit', 'Kit discovery 5x5ml — 3 brand SWI dalam 1 kemasan premium', 'produk', 150000, 80, 12000000, 9, 50, 50, 'musyarakah', 70000, 250000, 'open');
  }

  // Seed transactions — historis setoran
  const insertTx = db.prepare(
    "INSERT INTO transactions (tanggal, jenis, kategori, deskripsi, jumlah, sumber, referensi) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  // Setoran Beriman: Sep 2023 (6.8M) + Jan 2024 (20M) + Jun 2026 (7M) + Gaji 18 bulan (9M) = 42.8M
  insertTx.run("2023-09-01", "pemasukan", "Setoran Modal", "Setoran modal Beriman Juliano (Sep 2023)", 6800000, "BRI Holding", "Setoran awal");
  insertTx.run("2024-01-01", "pemasukan", "Setoran Modal", "Setoran modal Beriman Juliano (Jan 2024)", 20000000, "BRI Holding", "Top-up setoran");
  insertTx.run("2026-06-04", "pemasukan", "Setoran Modal", "Cicilan setoran saham Beriman Juliano", 7000000, "BRI Holding", "Cicilan setoran bayar saham");
  // Gaji Beriman: Jan 2025 – Jun 2026 (18 bulan × 500.000 = 9M) → hutang saham
  insertTx.run("2025-01-01", "pemasukan", "Gaji → Setoran Saham", "Gaji Beriman Juliano 2025 (12 bulan × 500.000)", 6000000, "Hutang Saham", "Gaji → Setoran Saham");
  insertTx.run("2026-01-01", "pemasukan", "Gaji → Setoran Saham", "Gaji Beriman Juliano Jan-Jun 2026 (6 bulan × 500.000)", 3000000, "Hutang Saham", "Gaji → Setoran Saham");

  // Setoran Wapiq: Okt 2023 (6.435M) + Des 2025 (9M) + Gaji 18 bulan (9M) = 24.435M
  insertTx.run("2023-10-01", "pemasukan", "Setoran Modal", "Setoran modal Wapiq Rizya Zaelan (Okt 2023)", 6435000, "BRI Holding", "Setoran awal");
  insertTx.run("2025-12-01", "pemasukan", "Setoran Modal", "Setoran modal Wapiq Rizya Zaelan (Des 2025)", 9000000, "BRI Holding", "Top-up setoran");
  // Gaji Wapiq: Jan 2025 – Jun 2026 (18 bulan × 500.000 = 9M) → hutang saham
  insertTx.run("2025-01-01", "pemasukan", "Gaji → Setoran Saham", "Gaji Wapiq Rizya Zaelan 2025 (12 bulan × 500.000)", 6000000, "Hutang Saham", "Gaji → Setoran Saham");
  insertTx.run("2026-01-01", "pemasukan", "Gaji → Setoran Saham", "Gaji Wapiq Rizya Zaelan Jan-Jun 2026 (6 bulan × 500.000)", 3000000, "Hutang Saham", "Gaji → Setoran Saham");

  // Seed events — Fragrantions 2026
  db.prepare(`
    INSERT OR IGNORE INTO events (id, name, slug, type, status, description, pic, instagram, start_date, end_date, location, venue, budget, notes)
    VALUES ('evt-fragrantions-2026', 'Fragrantions 2026', 'fragrantions-2026', 'festival', 'planning', 'Parfum festival tahunan Indonesia — mempertemukan kreator, brand, dan pecinta parfum', 'Wapiq Rizya Zaelan', '@fragrantions', '2026-08-01', '2026-08-03', 'Jakarta', 'TBA', 500000000, 'Event tahunan utama SWI. Road to Fragrantions dimulai Juni 2026.')
  `).run();

  // Seed timeline for Fragrantions 2026
  const timelineItems = [
    ['Konsep', 'Finalisasi konsep & tema', '2026-01-31', 1],
    ['Venue Booking', 'Booking venue & DP', '2026-03-31', 0],
    ['Sponsorship', 'Proposal sponsorship terkirim', '2026-04-30', 0],
    ['Tenant', 'Pembukaan pendaftaran tenant', '2026-05-15', 0],
    ['Marketing', 'Launch kampanye marketing', '2026-06-01', 0],
    ['Road to Fragrantions', 'Pop-up events di kota besar', '2026-06-30', 0],
    ['Final Prep', 'Technical meeting & rehearsal', '2026-07-25', 0],
    ['Event Day', 'Fragrantions 2026 berlangsung', '2026-08-01', 0],
    ['Settlement', 'Pembayaran tenant & sponsor selesai', '2026-08-15', 0],
  ];
  const insertTimeline = db.prepare(`
    INSERT OR IGNORE INTO event_timeline (event_id, phase, milestone, due_date, completed)
    VALUES ('evt-fragrantions-2026', ?, ?, ?, ?)
  `);
  for (const [phase, milestone, due, done] of timelineItems) {
    insertTimeline.run(phase, milestone, due, done);
  }

  // Seed CRM customers
  const crmCount = db.prepare("SELECT COUNT(*) as c FROM customers").get();
  if (crmCount.c === 0) {
    const insertCustomer = db.prepare(`
      INSERT INTO customers (id, name, whatsapp, segment, interest, source, consent, last_contact, total_purchases, clv, recommended_formula, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertCustomer.run("CUST-ANDI001", "Andi Pratama", "081234567890", "regular", "L'Arc~en~Scent EDP", "Instagram", "yes", "2026-06-10", 3, 360000, "L'Arc~en~Scent 30ml", "Repeat buyer, suka woody");
    insertCustomer.run("CUST-BUDI002", "Budi Santoso", "081345678901", "new", "Pixel Potion Discovery Set", "TikTok", "yes", "2026-06-12", 1, 180000, "Pixel Potion 3x5ml", "First purchase, gamer vibe");
    insertCustomer.run("CUST-CITRA003", "Citra Dewi", "081456789012", "loyal", "Nuscentza EDP", "Referral", "yes", "2026-06-08", 7, 665000, "Nuscentza 30ml", "Loyal customer, suka floral");
    insertCustomer.run("CUST-DIAN004", "Dian Lestari", "081567890123", "new", "SWI T-Shirt Collection", "Event", "TBA", "2026-06-14", 0, 0, "TBA", "Met at Fragrantions road event");
    insertCustomer.run("CUST-EDO005", "Edo Wijaya", "081678901234", "regular", "SWI Tumbler Series", "Instagram", "yes", "2026-06-05", 2, 240000, "SWI Tumbler", "Eco-conscious buyer");
    insertCustomer.run("CUST-FIA006", "Fia Ramadhani", "081789012345", "new", "SWI Scented Candle", "TikTok", "no", "2026-06-15", 0, 0, "TBA", "Interested but no consent yet");
    insertCustomer.run("CUST-GUN007", "Gunawan Hadi", "081890123456", "vip", "L'Arc~en~Scent Collection", "Direct", "yes", "2026-06-16", 15, 1800000, "L'Arc~en~Scent 50ml", "VIP collector, buys full collection");
    insertCustomer.run("CUST-HANA008", "Hana Putri", "081901234567", "regular", "SWI Perfume Discovery Kit", "Event", "yes", "2026-06-11", 4, 600000, "Discovery Kit 5x5ml", "Gift buyer");

    // Seed interactions
    const insertInteraction = db.prepare(`
      INSERT INTO customer_interactions (interaction_id, customer_id, name, type, channel, summary, value, follow_up_date, pic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertInteraction.run("CI-20260610-001", "CUST-ANDI001", "Andi Pratama", "purchase", "WhatsApp", "Purchased L'Arc~en~Scent 30ml x3", 360000, "2026-07-10", "HemuHemu/OWL");
    insertInteraction.run("CI-20260612-001", "CUST-BUDI002", "Budi Santoso", "purchase", "Instagram DM", "Purchased Pixel Potion Discovery Set", 180000, "2026-06-26", "HemuHemu/OWL");
    insertInteraction.run("CI-20260608-001", "CUST-CITRA003", "Citra Dewi", "purchase", "WhatsApp", "Purchased Nuscentza 30ml x7", 665000, "2026-07-08", "HemuHemu/OWL");
    insertInteraction.run("CI-20260614-001", "CUST-DIAN004", "Dian Lestari", "inquiry", "Event Booth", "Interested in T-Shirt Collection, needs pricing", 0, "2026-06-21", "HemuHemu/OWL");
    insertInteraction.run("CI-20260605-001", "CUST-EDO005", "Edo Wijaya", "purchase", "WhatsApp", "Purchased SWI Tumbler x2", 240000, "2026-07-05", "HemuHemu/OWL");
    insertInteraction.run("CI-20260615-001", "CUST-FIA006", "Fia Ramadhani", "inquiry", "TikTok DM", "Asked about Scented Candle pricing", 0, "2026-06-18", "HemuHemu/OWL");
    insertInteraction.run("CI-20260616-001", "CUST-GUN007", "Gunawan Hadi", "purchase", "WhatsApp", "Purchased full L'Arc~en~Scent collection", 1800000, "2026-07-16", "HemuHemu/OWL");
    insertInteraction.run("CI-20260611-001", "CUST-HANA008", "Hana Putri", "purchase", "Event Booth", "Purchased Discovery Kit x4", 600000, "2026-06-25", "HemuHemu/OWL");
  }
}

export default getDb;
