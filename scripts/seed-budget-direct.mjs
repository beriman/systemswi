// Direct Google Sheets seed — bypasses Next.js server
import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

function loadCredentials() {
  try {
    const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    return {
      client_id: content.client_id,
      client_secret: content.client_secret,
      refresh_token: content.refresh_token,
      access_token: content.token || content.access_token || "",
      expiry_date: content.expiry_date || content.expiry || 0,
    };
  } catch (e) {
    console.error("Failed to load credentials:", e.message);
    process.exit(1);
  }
}

const creds = loadCredentials();
const oauth2 = new google.auth.OAuth2(
  creds.client_id,
  creds.client_secret,
  "http://localhost:1"
);
oauth2.setCredentials({
  refresh_token: creds.refresh_token,
  access_token: creds.access_token,
  token_type: "Bearer",
  expiry_date: creds.expiry_date,
});

const sheets = google.sheets({ version: "v4", auth: oauth2 });

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
      id,
      cat.name,
      month.name,
      "2026",
      budget,
      actual,
      remaining,
      "",
      `Seed data ${cat.name} ${month.name}`,
      new Date().toISOString().split("T")[0],
      "",
    ]);
    idCounter++;
  }
}

const headers = [
  "ID", "Category", "Month", "Year", "Budget", "Actual",
  "Remaining", "Event", "Notes", "Created", "Updated",
];

const allRows = [headers, ...rows];

// Pad each row to 18 columns (A-R)
const paddedRows = allRows.map((row) => {
  const padded = [...row];
  while (padded.length < 18) padded.push("");
  return padded;
});

// Pad to 500 rows
while (paddedRows.length < 500) {
  paddedRows.push(Array(18).fill(""));
}

console.log(`Seeding ${rows.length} budget entries to Budget_vs_Actual...`);

try {
  // First clear the range
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "Budget_vs_Actual!A1:R500",
  });
  console.log("Cleared existing data.");

  // Write new data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Budget_vs_Actual!A1:R500",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: paddedRows },
  });

  console.log(`✅ Successfully seeded ${rows.length} budget entries!`);
  console.log(`Categories: ${CATEGORIES.map(c => c.name).join(", ")}`);
  console.log(`Months: ${MONTHS.map(m => m.name).join(", ")}`);
  console.log(`Demo alerts: Bahan Baku Jun-26 (97%), Iklan & Marketing Apr-26 (98%)`);
} catch (error) {
  console.error("❌ Failed to seed:", error.message);
  if (error.response) {
    console.error("Response:", JSON.stringify(error.response.data, null, 2));
  }
  process.exit(1);
}
