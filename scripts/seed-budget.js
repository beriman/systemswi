// Direct seed script — writes to Google Sheets using same credentials as sheets-real.ts
const { google } = require("googleapis");
const fs = require("fs");

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

const MONTHS = [
  "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026",
];

const CATEGORIES = [
  { name: "Bahan Baku", minBudget: 10_000_000, maxBudget: 15_000_000, actualMinPct: 0.60, actualMaxPct: 0.92 },
  { name: "Iklan & Marketing", minBudget: 3_000_000, maxBudget: 5_000_000, actualMinPct: 0.70, actualMaxPct: 0.88 },
  { name: "Sewa Booth", minBudget: 2_000_000, maxBudget: 8_000_000, actualMinPct: 0.50, actualMaxPct: 0.75 },
  { name: "Packaging", minBudget: 2_000_000, maxBudget: 4_000_000, actualMinPct: 0.55, actualMaxPct: 0.78 },
  { name: "Transport", minBudget: 500_000, maxBudget: 1_500_000, actualMinPct: 0.60, actualMaxPct: 0.85 },
];

const DEMO_ALERTS = {
  "Bahan Baku|Jun 2026": 0.97,
  "Iklan & Marketing|Apr 2026": 0.98,
};

function randBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

async function main() {
  // Load credentials
  const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  const oauth2 = new google.auth.OAuth2(
    content.client_id,
    content.client_secret,
    "http://localhost:1"
  );
  oauth2.setCredentials({
    refresh_token: content.refresh_token,
    access_token: content.token || content.access_token || "",
    token_type: "Bearer",
    expiry_date: content.expiry_date || content.expiry || 0,
  });
  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  // Clear existing data
  console.log("Clearing Budget_vs_Actual sheet...");
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "Budget_vs_Actual!A1:R500",
  });

  // Write headers
  const headers = [
    "ID", "Category", "Month", "Year", "Budget", "Actual",
    "Remaining", "Event", "Notes", "Created", "Updated",
  ];
  console.log("Writing headers...");

  // Generate seed rows
  const rows = [headers];
  let idCounter = 1;

  for (const cat of CATEGORIES) {
    for (const month of MONTHS) {
      const key = `${cat.name}|${month}`;
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
        month,
        "2026",
        budget,
        actual,
        remaining,
        "",
        `Seed data ${cat.name} ${month}`,
        new Date().toISOString().split("T")[0],
        "",
      ]);
      idCounter++;
    }
  }

  console.log(`Writing ${rows.length - 1} budget entries...`);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Budget_vs_Actual!A1:K${rows.length}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });

  console.log(`✅ Done! Seeded ${rows.length - 1} entries (5 categories × 6 months)`);
  console.log("Demo alerts: Bahan Baku Jun 2026 (97%), Iklan & Marketing Apr 2026 (98%)");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
