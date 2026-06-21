// Seed Expense Approval Flow data into Google Sheets
// Run: npx tsx scripts/seed-expenses.ts

import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
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
  } catch {
    return null;
  }
}

async function main() {
  const creds = loadCredentials();
  if (!creds) {
    console.error("❌ Google credentials not found");
    process.exit(1);
  }

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

  // Check if sheets exist, create if not
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingSheets = (ss.data.sheets || []).map((s) => s.properties?.title);

  // Create Expense_Submissions if not exists
  if (!existingSheets.includes("Expense_Submissions")) {
    console.log("📋 Creating Expense_Submissions sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Expense_Submissions" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Submissions!A1:L1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "Submission ID", "Date", "Submitter Name", "Related Event",
          "Category", "Description", "Amount", "Proof URL",
          "Status", "Reviewed By", "Reviewed Date", "Notes",
        ]],
      },
    });
    console.log("  ✅ Headers written");
  } else {
    console.log("📋 Expense_Submissions sheet already exists");
  }

  // Create Expense_Approvers if not exists
  if (!existingSheets.includes("Expense_Approvers")) {
    console.log("📋 Creating Expense_Approvers sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Expense_Approvers" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Approvers!A1:D1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Approver ID", "Name", "Role", "Email"]],
      },
    });
    console.log("  ✅ Headers written");
  } else {
    console.log("📋 Expense_Approvers sheet already exists");
  }

  // Check existing data
  const { data: subData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A:L",
  });
  const existingRows = (subData.values || []).length - 1; // minus header

  if (existingRows > 0) {
    console.log(`\n⚠️  Expense_Submissions already has ${existingRows} data row(s). Skipping seed.`);
    console.log("   Delete existing rows first if you want to re-seed.");
  } else {
    // Seed 5 sample submissions
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const sampleSubmissions = [
      [
        "EXP-001", lastMonth, "Beriman Juliano", "Pekan Parfum Indonesia 2026",
        "Sewa Booth", "Sewa booth utama hall A", 3500000, "",
        "Approved", "Beriman Juliano", lastMonth, "Approved — booth premium"
      ],
      [
        "EXP-002", lastWeek, "Siti Rahmawati", "Pekan Parfum Indonesia 2026",
        "Bahan Baku", "Pembelian essential oil lavender", 1250000, "",
        "Approved", "Beriman Juliano", lastWeek, "Approved — supplier tetap"
      ],
      [
        "EXP-003", twoDaysAgo, "Ahmad Fauzi", "Workshop Aroma Terapi",
        "Iklan", "Iklan Instagram 2 minggu", 800000, "",
        "Pending", "", "", ""
      ],
      [
        "EXP-004", yesterday, "Dewi Lestari", "Workshop Aroma Terapi",
        "Transport", "Transportasi narasumber dari Bandung", 1500000, "",
        "Pending", "", "", ""
      ],
      [
        "EXP-005", today, "Rudi Hartono", "Pekan Parfum Indonesia 2026",
        "Packaging", "Packaging khusus edisi event", 2000000, "",
        "Rejected", "Beriman Juliano", today, "Budget packaging sudah habis, pakai stok lama"
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Submissions!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: sampleSubmissions },
    });
    console.log(`\n✅ Seeded ${sampleSubmissions.length} expense submissions`);
  }

  // Check approvers
  const { data: apprData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A:D",
  });
  const existingApprovers = (apprData.values || []).length - 1;

  if (existingApprovers > 0) {
    console.log(`\n⚠️  Expense_Approvers already has ${existingApprovers} approver(s). Skipping seed.`);
  } else {
    const approvers = [
      ["APR-001", "Beriman Juliano", "Direktur", "beriman@swi.id"],
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Approvers!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: approvers },
    });
    console.log(`\n✅ Seeded ${approvers.length} approver: Beriman Juliano (Direktur)`);
  }

  console.log("\n🎉 Expense Approval Flow seed complete!");
  console.log(`   Spreadsheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
