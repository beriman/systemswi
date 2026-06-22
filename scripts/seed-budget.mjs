// Seed budget data directly via Google Sheets API
import fs from "fs";

const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";
const creds = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";

async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    refresh_token: creds.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to refresh token: " + JSON.stringify(data));
  return data.access_token;
}

async function sheetsGet(accessToken, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.values || [];
}

async function sheetsClear(accessToken, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

async function sheetsUpdate(accessToken, range, values) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  return res.json();
}

const MONTHS = [
  { name: "Jan-26", short: "Jan" },
  { name: "Feb-26", short: "Feb" },
  { name: "Mar-26", short: "Mar" },
  { name: "Apr-26", short: "Apr" },
  { name: "May-26", short: "May" },
  { name: "Jun-26", short: "Jun" },
];

const CATEGORIES = [
  { name: "Bahan Baku", minBudget: 10_000_000, maxBudget: 15_000_000, actualMinPct: 0.60, actualMaxPct: 0.92 },
  { name: "Iklan & Marketing", minBudget: 3_000_000, maxBudget: 5_000_000, actualMinPct: 0.70, actualMaxPct: 0.88 },
  { name: "Sewa Booth", minBudget: 2_000_000, maxBudget: 8_000_000, actualMinPct: 0.50, actualMaxPct: 0.75 },
  { name: "Packaging", minBudget: 2_000_000, maxBudget: 4_000_000, actualMinPct: 0.55, actualMaxPct: 0.78 },
  { name: "Transport", minBudget: 500_000, maxBudget: 1_500_000, actualMinPct: 0.60, actualMaxPct: 0.85 },
];

const DEMO_ALERTS = {
  "Bahan Baku|Jun-26": 0.97,
  "Iklan & Marketing|Apr-26": 0.98,
};

function randBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

async function main() {
  console.log("🔑 Getting access token...");
  const token = await getAccessToken();
  console.log("✅ Token obtained");

  // Check existing data
  console.log("📊 Checking existing Budget_vs_Actual data...");
  const existing = await sheetsGet(token, "Budget_vs_Actual!A1:R500");
  const hasData = existing.length > 1 && existing.slice(1).some(r => r.some(c => String(c).trim() !== ""));

  if (hasData) {
    console.log(`⚠️  Found ${existing.length - 1} existing rows. Clearing...`);
    await sheetsClear(token, "Budget_vs_Actual!A1:R500");
    console.log("✅ Cleared existing data");
  }

  // Generate seed rows
  const rows = [];
  let idCounter = 1;

  for (const cat of CATEGORIES) {
    for (const month of MONTHS) {
      const key = `${cat.name}|${month.name}`;
      const budget = randBetween(cat.minBudget, cat.maxBudget);

      let actualPct;
      if (DEMO_ALERTS[key] !== undefined) {
        actualPct = DEMO_ALERTS[key];
      } else {
        actualPct = cat.actualMinPct + Math.random() * (cat.actualMaxPct - cat.actualMinPct);
      }
      const actual = Math.round(budget * actualPct / 1000) * 1000;
      const remaining = budget - actual;

      const id = `bgt-${String(idCounter).padStart(4, "0")}`;
      rows.push([
        id, cat.name, month.name, "2026", budget, actual,
        remaining, "", `Seed data ${cat.name} ${month.name}`,
        new Date().toISOString().split("T")[0], "",
      ]);
      idCounter++;
    }
  }

  // Write headers + data
  const headers = ["ID", "Category", "Month", "Year", "Budget", "Actual", "Remaining", "Event", "Notes", "Created", "Updated"];
  const allRows = [headers, ...rows];

  // Pad each row to 18 columns
  const paddedRows = allRows.map(row => {
    const padded = [...row];
    while (padded.length < 18) padded.push("");
    return padded;
  });

  // Pad to 500 rows
  while (paddedRows.length < 500) {
    paddedRows.push(Array(18).fill(""));
  }

  console.log(`📝 Writing ${rows.length} budget entries to Google Sheets...`);
  await sheetsUpdate(token, "Budget_vs_Actual!A1:R500", paddedRows);
  console.log("✅ Seed complete!");

  // Verify
  const verify = await sheetsGet(token, "Budget_vs_Actual!A1:R5");
  console.log("\n📋 Verification (first 5 rows):");
  verify.forEach((row, i) => console.log(`  Row ${i}:`, row.slice(0, 6)));

  console.log(`\n📊 Summary:`);
  console.log(`  Categories: ${CATEGORIES.length} (${CATEGORIES.map(c => c.name).join(", ")})`);
  console.log(`  Months: ${MONTHS.length} (${MONTHS.map(m => m.name).join(", ")})`);
  console.log(`  Total entries: ${rows.length}`);
  console.log(`  Demo alerts: Bahan Baku Jun-26 (97%), Iklan & Marketing Apr-26 (98%)`);
}

main().catch(e => { console.error("❌ Error:", e.message); process.exit(1); });
