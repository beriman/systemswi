// Seed script for Budget vs Actual Tracker
// Run with: npx tsx scripts/seed-budget.ts
import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

function loadCredentials() {
  const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  return {
    client_id: content.client_id,
    client_secret: content.client_secret,
    refresh_token: content.refresh_token,
    access_token: content.token || content.access_token || "",
    expiry_date: content.expiry_date || content.expiry || 0,
  };
}

async function getAuth() {
  const creds = loadCredentials();
  const oauth2 = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:1"
  );
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.access_token,
    token_type: "Bearer",
    expiry_date: creds.expiry_date,
  });
  return oauth2;
}

async function ensureSheet(auth: any, sheetName: string, headers: string[]) {
  const sheets = google.sheets({ version: "v4", auth });
  
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((s: any) => s.properties?.title === sheetName);
  if (exists) {
    console.log(`Sheet "${sheetName}" already exists.`);
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:L1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });

  console.log(`Created sheet "${sheetName}" with headers.`);
}

async function appendRows(auth: any, sheetName: string, rows: (string | number)[][]) {
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:L`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
  console.log(`Appended ${rows.length} rows to "${sheetName}".`);
}

async function main() {
  const auth = await getAuth();

  // Ensure Budget_vs_Actual sheet exists with proper headers
  await ensureSheet(auth, "Budget_vs_Actual", [
    "ID", "Category", "Month", "Year", "Budget", "Actual", "Remaining", "Event", "Notes", "Created", "Updated"
  ]);

  // Seed data: 5 categories × 6 months (Jan-Jun 2026)
  const months = [
    "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"
  ];

  const categories = [
    { name: "Bahan Baku", minBudget: 10000000, maxBudget: 15000000, actualFactor: 0.85 },
    { name: "Iklan & Marketing", minBudget: 3000000, maxBudget: 5000000, actualFactor: 0.92 },
    { name: "Sewa Booth", minBudget: 2000000, maxBudget: 8000000, actualFactor: 0.98 },
    { name: "Packaging", minBudget: 2000000, maxBudget: 4000000, actualFactor: 0.88 },
    { name: "Transport", minBudget: 500000, maxBudget: 1500000, actualFactor: 1.05 }, // Over budget demo
  ];

  const rows: (string | number)[][] = [];
  const now = new Date().toISOString().split("T")[0];

  for (const cat of categories) {
    for (const month of months) {
      const id = `bgt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const budget = Math.round(
        cat.minBudget + Math.random() * (cat.maxBudget - cat.minBudget)
      );
      // For demo: make some categories >80% usage
      let actual: number;
      if (cat.name === "Sewa Booth" && month === "May 2026") {
        // Force >95% for demo
        actual = Math.round(budget * 0.97);
      } else if (cat.name === "Transport" && month === "Jun 2026") {
        // Force over budget for demo
        actual = Math.round(budget * 1.12);
      } else {
        actual = Math.round(budget * (cat.actualFactor + (Math.random() - 0.5) * 0.15));
      }
      const remaining = budget - actual;

      rows.push([
        id,
        cat.name,
        month,
        "2026",
        budget,
        actual,
        remaining,
        "",
        `Auto-seeded ${cat.name} ${month}`,
        now,
        now,
      ]);
    }
  }

  await appendRows(auth, "Budget_vs_Actual", rows);
  console.log(`\n✅ Seeded ${rows.length} budget entries (5 categories × 6 months).`);
  console.log("Demo alerts:");
  console.log("  - Sewa Booth May 2026: ~97% (danger)");
  console.log("  - Transport Jun 2026: ~112% (over budget)");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
