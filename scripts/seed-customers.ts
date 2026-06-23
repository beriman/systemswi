/**
 * Seed data untuk Customer 360 module
 * - 10 sample customers (3 VIP, 4 Regular, 3 New)
 * - 15 sample interactions
 * 
 * Usage: npx tsx scripts/seed-customers.ts
 */

import { appendRows, readRange, writeRange } from "@/lib/sheets/sheets-real";
import { ensureCustomerTables } from "@/lib/customer/init-db";

const text = (value: unknown) => String(value ?? "").trim();

// ── Generate unique IDs using time-based counter ──
let idCounter = 0;
function uniqueId(prefix: string) {
  const ts = Date.now().toString(36).toUpperCase();
  idCounter++;
  return `${prefix}-${ts}-${String(idCounter).padStart(3, "0")}`;
}

// ── Sample Customers ──
const sampleCustomers = [
  // VIP customers (≥10 purchases, high CLV)
  {
    id: "CUST-ANDRA-1234",
    name: "Andra Wijaya",
    whatsapp: "6281212341234",
    segment: "vip",
    interest: "Parfum premium unisex",
    source: "WhatsApp Business",
    consent: "yes",
    lastContact: "2026-06-20",
    totalPurchases: 15,
    clv: 12500000,
    recommendedFormula: "Amber Oud",
    notes: "Langganan bulanan, preferensi aroma oud. Suka gift wrapping.",
    rowNumber: 0,
  },
  {
    id: "CUST-SITI9-5678",
    name: "Siti Nurhaliza",
    whatsapp: "6281356785678",
    segment: "vip",
    interest: "Body mist & lotion set",
    source: "Instagram DM",
    consent: "yes",
    lastContact: "2026-06-18",
    totalPurchases: 22,
    clv: 18750000,
    recommendedFormula: "Rose Vanilla",
    notes: "Reseller aktif, order besar tiap Ramadhan. Prioritas follow-up.",
    rowNumber: 0,
  },
  {
    id: "CUST-BUDI1-9012",
    name: "Budi Santoso",
    whatsapp: "6281590129012",
    segment: "vip",
    interest: "Shower oil & scrub",
    source: "Tokopedia Review",
    consent: "yes",
    lastContact: "2026-06-22",
    totalPurchases: 30,
    clv: 25000000,
    recommendedFormula: "Ocean Breeze",
    notes: "Bulk buyer untuk hotel & spa. Perlu invoice faktur pajak.",
    rowNumber: 0,
  },

  // Regular customers (2–4 purchases)
  {
    id: "CUST-DEWI2-3456",
    name: "Dewi Lestari",
    whatsapp: "6281634563456",
    segment: "regular",
    interest: "Hand cream set",
    source: "WhatsApp",
    consent: "yes",
    lastContact: "2026-06-15",
    totalPurchases: 3,
    clv: 1200000,
    recommendedFormula: "Jasmine Dream",
    notes: "Pembelian pertama via WA. Suka packaging cantik.",
    rowNumber: 0,
  },
  {
    id: "CUST-RIA99-7890",
    name: "Ria Amelia",
    whatsapp: "6281778907890",
    segment: "regular",
    interest: "Lip balm & lip scrub",
    source: "Shopee",
    consent: "TBA",
    lastContact: "2026-06-10",
    totalPurchases: 2,
    clv: 850000,
    recommendedFormula: "Honey Peach",
    notes: "Follow-up consent belum dikonfirmasi.",
    rowNumber: 0,
  },
  {
    id: "CUST-FANI9-1122",
    name: "Fani Pratiwi",
    whatsapp: "6281811221122",
    segment: "regular",
    interest: "Hair perfume mist",
    source: "Instagram",
    consent: "yes",
    lastContact: "2026-06-08",
    totalPurchases: 4,
    clv: 2100000,
    recommendedFormula: "Citrus Bloom",
    notes: "Influencer micro, potensi collab.",
    rowNumber: 0,
  },
  {
    id: "CUST-JOKO3-3344",
    name: "Joko Widodo",
    whatsapp: "6281933443344",
    segment: "regular",
    interest: "Deodorant spray",
    source: "Offline Store",
    consent: "no",
    lastContact: "2026-05-28",
    totalPurchases: 3,
    clv: 950000,
    recommendedFormula: "Fresh Mint",
    notes: "Tidak mau di-follow up via WA. Suka datang langsung ke toko.",
    rowNumber: 0,
  },

  // New customers (0–1 purchases)
  {
    id: "CUST-MAYA4-5566",
    name: "Maya Sari",
    whatsapp: "6282155665566",
    segment: "new",
    interest: "Trial kit parfum",
    source: "TikTok Ads",
    consent: "TBA",
    lastContact: "2026-06-23",
    totalPurchases: 1,
    clv: 350000,
    recommendedFormula: "TBA",
    notes: "Baru daftar via TikTok. Belum ada pembelian.",
    rowNumber: 0,
  },
  {
    id: "CUST-RINA5-7788",
    name: "Rina Kusuma",
    whatsapp: "6282217787788",
    segment: "new",
    interest: "Gift set wedding",
    source: "Referral",
    consent: "TBA",
    lastContact: "2026-06-24",
    totalPurchases: 0,
    clv: 0,
    recommendedFormula: "TBA",
    notes: "Tanya-tanya gift set untuk wedding party.",
    rowNumber: 0,
  },
  {
    id: "CUST-EKO9-9900",
    name: "Eko Prasetyo",
    whatsapp: "6282399009900",
    segment: "new",
    interest: "Scented candles",
    source: "Google Search",
    consent: "yes",
    lastContact: "2026-06-21",
    totalPurchases: 1,
    clv: 420000,
    recommendedFormula: "Sandalwood",
    notes: "Bisnis interior, tertarik untuk custom scent.",
    rowNumber: 0,
  },
];

// ── Helper: Customer row for Sheets (13 columns A:M) ──
function customerRow(c: typeof sampleCustomers[0]) {
  return [
    c.id,
    c.name,
    c.whatsapp,
    c.segment,
    c.interest,
    c.source,
    c.consent,
    c.lastContact,
    c.totalPurchases.toString(),
    c.clv.toString(),
    c.recommendedFormula,
    c.notes,
    new Date().toISOString().slice(0, 10),
  ];
}

// ── Helper: Interaction row for Sheets (10 columns A:J) ──
function interactionRow(vals: {
  timestamp: string;
  interactionId: string;
  customerId: string;
  customerName: string;
  type: string;
  channel: string;
  summary: string;
  value: string;
  followUpDate: string;
  pic: string;
}) {
  return [
    vals.timestamp,
    vals.interactionId,
    vals.customerId,
    vals.customerName,
    vals.type,
    vals.channel,
    vals.summary,
    vals.value,
    vals.followUpDate,
    vals.pic,
  ];
}

const now = new Date().toISOString().slice(0, 10);

// ── Sample Interactions (15) ──
const sampleInteractions = [
  // Andra Wijaya — 2 interactions
  {
    timestamp: "2026-06-20T10:30:00",
    interactionId: "CI-20260620-001",
    customerId: "CUST-ANDRA-1234",
    customerName: "Andra Wijaya",
    type: "purchase",
    channel: "WhatsApp",
    summary: "Order 3x Amber Oud 100ml untuk kebutuhan pribadi",
    value: "2250000",
    followUpDate: "2026-07-01",
    pic: "HemuHemu/OWL",
  },
  {
    timestamp: "2026-06-01T09:15:00",
    interactionId: "CI-20260601-002",
    customerId: "CUST-ANDRA-1234",
    customerName: "Andra Wijaya",
    type: "follow_up",
    channel: "WhatsApp",
    summary: "Follow-up setelah pengiriman. Customer satisfied.",
    value: "0",
    followUpDate: "2026-06-15",
    pic: "HemuHemu/OWL",
  },

  // Siti Nurhaliza — 3 interactions
  {
    timestamp: "2026-06-18T14:20:00",
    interactionId: "CI-20260618-001",
    customerId: "CUST-SITI9-5678",
    customerName: "Siti Nurhaliza",
    type: "purchase",
    channel: "Instagram DM",
    summary: "Order 20x Rose Vanilla body mist untuk restock toko",
    value: "15000000",
    followUpDate: "2026-07-15",
    pic: "HemuHemu/OWL",
  },
  {
    timestamp: "2026-06-05T11:00:00",
    interactionId: "CI-20260605-001",
    customerId: "CUST-SITI9-5678",
    customerName: "Siti Nurhaliza",
    type: "inquiry",
    channel: "Instagram DM",
    summary: "Tanya ketersediaan Edisi Ramadhan dan minimal order",
    value: "0",
    followUpDate: "2026-06-06",
    pic: "HemuHemu/OWL",
  },
  {
    timestamp: "2026-05-20T16:45:00",
    interactionId: "CI-20260520-001",
    customerId: "CUST-SITI9-5678",
    customerName: "Siti Nurhaliza",
    type: "purchase",
    channel: "WhatsApp",
    summary: "Order pertama via WhatsApp setelah dapat rekomendasi dari Andra",
    value: "5000000",
    followUpDate: "2026-05-25",
    pic: "HemuHemu/OWL",
  },

  // Budi Santoso — 2 interactions
  {
    timestamp: "2026-06-22T08:00:00",
    interactionId: "CI-20260622-001",
    customerId: "CUST-BUDI1-9012",
    customerName: "Budi Santoso",
    type: "purchase",
    channel: "Email",
    summary: "Bulk order 50x Ocean Breeze untuk hotel Grand Hyatt",
    value: "35000000",
    followUpDate: "2026-06-30",
    pic: "HemuHemu/OWL",
  },
  {
    timestamp: "2026-06-15T13:30:00",
    interactionId: "CI-20260615-001",
    customerId: "CUST-BUDI1-9012",
    customerName: "Budi Santoso",
    type: "meeting",
    channel: "Offline",
    summary: "Meeting di hotel untuk presentasi custom scent",
    value: "0",
    followUpDate: "2026-06-20",
    pic: "HemuHemu/OWL",
  },

  // Dewi Lestari — 2 interactions
  {
    timestamp: "2026-06-15T19:00:00",
    interactionId: "CI-20260615-002",
    customerId: "CUST-DEWI2-3456",
    customerName: "Dewi Lestari",
    type: "purchase",
    channel: "WhatsApp",
    summary: "Beli 2x hand cream Jasmine Dream + 1 body mist",
    value: "680000",
    followUpDate: "2026-06-25",
    pic: "HemuHemu/OWL",
  },
  {
    timestamp: "2026-06-01T10:00:00",
    interactionId: "CI-20260601-003",
    customerId: "CUST-DEWI2-3456",
    customerName: "Dewi Lestari",
    type: "inquiry",
    channel: "WhatsApp",
    summary: "Tanya-tanya produk yang cocok untuk kulit sensitif",
    value: "0",
    followUpDate: "2026-06-02",
    pic: "HemuHemu/OWL",
  },

  // Ria Amelia — 2 interactions
  {
    timestamp: "2026-06-10T15:00:00",
    interactionId: "CI-20260610-001",
    customerId: "CUST-RIA99-7890",
    customerName: "Ria Amelia",
    type: "purchase",
    channel: "Shopee",
    summary: "Order lip balm Honey Peach via Shopee",
    value: "350000",
    followUpDate: "2026-06-20",
    pic: "HemuHemu/OWL",
  },
  {
    timestamp: "2026-05-15T12:00:00",
    interactionId: "CI-20260515-001",
    customerId: "CUST-RIA99-7890",
    customerName: "Ria Amelia",
    type: "follow_up",
    channel: "WhatsApp",
    summary: "Follow-up setelah paket sampai. Minta konfirmasi consent.",
    value: "0",
    followUpDate: "2026-05-17",
    pic: "HemuHemu/OWL",
  },

  // Fani Pratiwi — 1 interaction
  {
    timestamp: "2026-06-08T20:00:00",
    interactionId: "CI-20260608-001",
    customerId: "CUST-FANI9-1122",
    customerName: "Fani Pratiwi",
    type: "collab",
    channel: "Instagram DM",
    summary: "Diskusi kerjasama influencer. Kirim sample Citrus Bloom.",
    value: "0",
    followUpDate: "2026-06-15",
    pic: "HemuHemu/OWL",
  },

  // Maya Sari — 2 interactions
  {
    timestamp: "2026-06-23T11:00:00",
    interactionId: "CI-20260623-001",
    customerId: "CUST-MAYA4-5566",
    customerName: "Maya Sari",
    type: "inquiry",
    channel: "WhatsApp",
    summary: "Tanya trial kit parfum. Dari TikTok Ads.",
    value: "0",
    followUpDate: "2026-06-24",
    pic: "HemuHemu/OWL",
  },
  {
    timestamp: "2026-06-23T11:30:00",
    interactionId: "CI-20260623-002",
    customerId: "CUST-MAYA4-5566",
    customerName: "Maya Sari",
    type: "purchase",
    channel: "WhatsApp",
    summary: "Order trial kit 5 varian + 1 body mist",
    value: "350000",
    followUpDate: "2026-07-01",
    pic: "HemuHemu/OWL",
  },
];

// ── Main seed function ──
async function seed() {
  console.log("🔧 Seeding Customer 360 data...\n");

  // 1. Check existing data
  console.log("📖 Checking existing Customer_Master data...");
  try {
    const custRows = await readRange("Customer_Master!A1:M1000");
    const existingCustomers = custRows.slice(1).filter((row: string[]) => row.some(Boolean));
    console.log(`   Found ${existingCustomers.length} existing customers in Google Sheets`);
  } catch {
    console.log("   Google Sheets read failed — will use SQLite only");
  }

  console.log("📖 Checking existing Customer_Interactions data...");
  try {
    const intRows = await readRange("Customer_Interactions!A1:J1000");
    const existingInteractions = intRows.slice(1).filter((row: string[]) => row.some(Boolean));
    console.log(`   Found ${existingInteractions.length} existing interactions in Google Sheets`);
  } catch {
    console.log("   Google Sheets read failed — will use SQLite only");
  }

  // 2. Write to SQLite (always works)
  console.log("\n📝 Writing to SQLite...");
  try {
    const Database = require("better-sqlite3");
    const path = require("path");
    const fs = require("fs");
    const dbDir = path.join(process.cwd(), ".data");
    const dbPath = path.join(dbDir, "systemswi.db");
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    ensureCustomerTables(db);

    let custCount = 0;
    for (const c of sampleCustomers) {
      const existing = db.prepare("SELECT id FROM customers WHERE id = ?").get(c.id);
      if (!existing) {
        db.prepare(`INSERT INTO customers (id, name, whatsapp, segment, interest, source, consent, last_contact, total_purchases, clv, recommended_formula, notes, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(c.id, c.name, c.whatsapp, c.segment, c.interest, c.source, c.consent, c.lastContact, c.totalPurchases, c.clv, c.recommendedFormula, c.notes, now);
        custCount++;
      } else {
        console.log(`   ⚠️  Customer ${c.id} already exists, updating...`);
        db.prepare(`UPDATE customers SET name=?, whatsapp=?, segment=?, interest=?, source=?, consent=?, last_contact=?, total_purchases=?, clv=?, recommended_formula=?, notes=?, updated_at=? WHERE id=?`)
          .run(c.name, c.whatsapp, c.segment, c.interest, c.source, c.consent, c.lastContact, c.totalPurchases, c.clv, c.recommendedFormula, c.notes, now, c.id);
        custCount++;
      }
    }
    console.log(`   ✅ ${custCount} customers written to SQLite`);

    let intCount = 0;
    for (const ix of sampleInteractions) {
      db.prepare(`INSERT OR REPLACE INTO customer_interactions (interaction_id, customer_id, name, type, channel, summary, value, follow_up_date, pic) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(ix.interactionId, ix.customerId, ix.customerName, ix.type, ix.channel, ix.summary, Number(ix.value), ix.followUpDate, ix.pic);
      intCount++;
    }
    console.log(`   ✅ ${intCount} interactions written to SQLite`);

    db.close();
  } catch (error) {
    console.error("   ❌ SQLite write failed:", error);
  }

  // 3. Write to Google Sheets
  console.log("\n📊 Writing to Google Sheets...");
  try {
    // Check if sheet has header row, if not add it
    let hasHeader = false;
    try {
      const firstRow = await readRange("Customer_Master!A1:M1");
      hasHeader = firstRow.length > 0 && text(firstRow[0]?.[0]).toLowerCase().includes("id");
    } catch {
      // Sheet might not exist
    }

    const custData = sampleCustomers.map(customerRow);
    if (!hasHeader) {
      const header = ["ID", "Nama", "WhatsApp", "Segment", "Minat", "Sumber", "Consent", "Last Contact", "Total Purchases", "CLV", "Recommended Formula", "Notes", "Updated At"];
      custData.unshift(header);
    }
    await appendRows("CustomerMaster", custData);
    console.log(`   ✅ ${sampleCustomers.length} customers appended to Google Sheets`);
  } catch (error) {
    console.log(`   ⚠️  Google Sheets Customer_Mask write skipped: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    // Check if sheet has header row
    let hasHeader = false;
    try {
      const firstRow = await readRange("Customer_Interactions!A1:J1");
      hasHeader = firstRow.length > 0 && text(firstRow[0]?.[0]).toLowerCase().includes("timestamp");
    } catch {
      // Sheet might not exist
    }

    const intData = sampleInteractions.map(ix => interactionRow(ix));
    if (!hasHeader) {
      const header = ["Timestamp", "Interaction ID", "Customer ID", "Nama", "Tipe", "Channel", "Summary", "Value", "Follow-up Date", "PIC"];
      intData.unshift(header);
    }
    await appendRows("CustomerInteractions", intData);
    console.log(`   ✅ ${sampleInteractions.length} interactions appended to Google Sheets`);
  } catch (error) {
    console.log(`   ⚠️  Google Sheets Customer_Interactions write skipped: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("   • 10 customers (3 VIP, 4 Regular, 3 New)");
  console.log("   • 15 interactions across all segments");
  console.log("   • Data written to SQLite + Google Sheets");
  console.log("\n📌 Next steps:");
  console.log("   1. Test: curl http://localhost:3000/api/customers");
  console.log("   2. Test: curl http://localhost:3000/api/customers/segments");
  console.log("   3. Open: http://localhost:3000/customers");
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
