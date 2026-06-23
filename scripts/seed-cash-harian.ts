import { writeRange, readRange } from "./src/lib/sheets/sheets-real";

const HEADERS = [
  "Entry ID", "Date", "Type", "Category", "Description",
  "Amount", "Saldo", "Input By", "Input Date"
];

const today = new Date();
function getDateStr(daysAgo: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// Generate 14 days of seed data (today - 13 days ago = 14 days)
const seedData: { date: string; type: "Masuk" | "Keluar"; category: string; description: string; amount: number }[] = [];

for (let i = 13; i >= 0; i--) {
  const date = getDateStr(i);

  // Every day has at least one masuk (sales)
  seedData.push({
    date,
    type: "Masuk",
    category: "Penjualan",
    description: `Penjualan harian ${date}`,
    amount: 300000 + Math.floor(Math.random() * 700000),
  });

  // Some days have additional income
  if (i % 7 === 0) {
    seedData.push({
      date,
      type: "Masuk",
      category: "Investasi",
      description: "Modal tambahan investor",
      amount: 2000000,
    });
  }

  // Most days have expenses
  if (i % 3 === 0) {
    seedData.push({
      date,
      type: "Keluar",
      category: "Bahan Baku",
      description: `Pembelian bahan baku - ${date}`,
      amount: 150000 + Math.floor(Math.random() * 350000),
    });
  }

  if (i % 2 === 0) {
    seedData.push({
      date,
      type: "Keluar",
      category: "Transport",
      description: "Transportasi logistik",
      amount: 50000 + Math.floor(Math.random() * 100000),
    });
  }

  if (i % 5 === 0) {
    seedData.push({
      date,
      type: "Keluar",
      category: "Operasional",
      description: "Operasional kantor & utilities",
      amount: 200000,
    });
  }

  // Gaji every 7 days
  if (i === 7 || i === 0) {
    seedData.push({
      date,
      type: "Keluar",
      category: "Gaji",
      description: "Pembayaran gaji karyawan",
      amount: 3000000,
    });
  }
}

async function seed() {
  console.log(`Seeding ${seedData.length} entries...`);

  // Ensure headers
  try {
    const existing = await readRange("Cash_Harian!A4:I4");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await writeRange("Cash_Harian!A4:I4", [HEADERS]);
      console.log("Headers written to Cash_Harian!A4:I4");
    } else {
      console.log("Headers already exist, skipping header write");
    }
  } catch (e) {
    console.log("Error reading headers, writing new ones...");
    await writeRange("Cash_Harian!A4:I4", [HEADERS]);
  }

  // Check existing data
  try {
    const existingData = await readRange("Cash_Harian!A5:I1000");
    if (existingData && existingData.length > 0 && existingData.some((r) => r.some(Boolean))) {
      console.log(`Cash_Harian already has ${existingData.filter((r) => r.some(Boolean)).length} rows. Overwriting...`);
    }
  } catch {
    console.log("No existing data, proceeding...");
  }

  // Sort by date then type (Masuk before Keluar on same day)
  seedData.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.type === "Masuk" ? -1 : 1;
  });

  // Calculate running balance starting from 5,000,000
  let saldo = 5000000;
  const inputDate = today.toISOString().slice(0, 10);
  const rows: (string | number)[][] = [];

  for (let idx = 0; idx < seedData.length; idx++) {
    const entry = seedData[idx];
    const entryId = `CH-SEED-${inputDate}-${String(idx).padStart(4, "0")}`;

    if (entry.type === "Masuk") {
      saldo += entry.amount;
    } else {
      saldo -= entry.amount;
    }

    rows.push([
      entryId,
      entry.date,
      entry.type,
      entry.category,
      entry.description,
      entry.amount,
      saldo,
      "system",
      inputDate,
    ]);
  }

  // Write all rows at once
  if (rows.length > 0) {
    const endRow = 5 + rows.length - 1;
    await writeRange(`Cash_Harian!A5:I${endRow}`, rows);
    console.log(`✅ Seeded ${rows.length} entries to Cash_Harian!A5:I${endRow}`);
    console.log(`   Date range: ${seedData[0].date} to ${seedData[seedData.length - 1].date}`);
    console.log(`   Final saldo: Rp ${saldo.toLocaleString("id-ID")}`);
  }
}

seed().catch(console.error);
