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
    CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions(tanggal);
    CREATE INDEX IF NOT EXISTS idx_transactions_jenis ON transactions(jenis);
    CREATE INDEX IF NOT EXISTS idx_production_status ON production_batches(status);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
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

  // Seed transactions — historis setoran
  const insertTx = db.prepare(
    "INSERT INTO transactions (tanggal, jenis, kategori, deskripsi, jumlah, sumber, referensi) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  // Setoran Beriman: Sep 2023 (6.8M) + Jan 2024 (20M) + Jun 2026 (7M) = 33.8M
  insertTx.run("2023-09-01", "pemasukan", "Setoran Modal", "Setoran modal Beriman Juliano (Sep 2023)", 6800000, "BRI Holding", "Setoran awal");
  insertTx.run("2024-01-01", "pemasukan", "Setoran Modal", "Setoran modal Beriman Juliano (Jan 2024)", 20000000, "BRI Holding", "Top-up setoran");
  insertTx.run("2026-06-04", "pemasukan", "Setoran Modal", "Cicilan setoran saham Beriman Juliano", 7000000, "BRI Holding", "Cicilan setoran bayar saham");

  // Setoran Wapiq: Okt 2023 (6.435M) + Des 2025 (9M) = 15.435M
  insertTx.run("2023-10-01", "pemasukan", "Setoran Modal", "Setoran modal Wapiq Rizya Zaelan (Okt 2023)", 6435000, "BRI Holding", "Setoran awal");
  insertTx.run("2025-12-01", "pemasukan", "Setoran Modal", "Setoran modal Wapiq Rizya Zaelan (Des 2025)", 9000000, "BRI Holding", "Top-up setoran");
}

export default getDb;
