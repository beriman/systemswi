// Seed expense data into Google Sheets
// Run with: npx tsx scripts/seed-expenses.ts
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
    console.error("❌ No Google credentials found");
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

  const existingSheets = ss.data.sheets?.map((s) => s.properties?.title) || [];

  // Create Expense_Submissions if not exists
  if (!existingSheets.includes("Expense_Submissions")) {
    console.log("Creating Expense_Submissions sheet...");
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
          "Status", "Reviewed By", "Reviewed Date", "Notes"
        ]],
      },
    });
    console.log("✅ Expense_Submissions sheet created with headers");
  } else {
    console.log("ℹ️  Expense_Submissions sheet already exists");
  }

  // Create Expense_Approvers if not exists
  if (!existingSheets.includes("Expense_Approvers")) {
    console.log("Creating Expense_Approvers sheet...");
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
    console.log("✅ Expense_Approvers sheet created with headers");
  } else {
    console.log("ℹ️  Expense_Approvers sheet already exists");
  }

  // Check existing data
  const { data: subData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A:L",
  });
  const existingRows = subData.values || [];
  const dataRowCount = existingRows.length > 1 ? existingRows.length - 1 : 0;
  console.log(`ℹ️  Expense_Submissions has ${dataRowCount} data rows`);

  // Seed 5 sample submissions if less than 5 exist
  if (dataRowCount < 5) {
    console.log("Seeding 5 sample expense submissions...");
    const today = new Date().toISOString().slice(0, 10);
    const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const twoMonthsAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);

    const submissions = [
      ["EXP-001", twoMonthsAgo, "Beriman Juliano", "Pekan Parfum Indonesia 2026", "Sewa Booth", "Sewa booth utama hall A", 5000000, "", "Approved", "Beriman Juliano", twoMonthsAgo, "Approved - booth premium"],
      ["EXP-002", lastMonth, "Siti Rahmawati", "Pekan Parfum Indonesia 2026", "Iklan", "Banner dan spanduk promosi", 1500000, "", "Approved", "Beriman Juliano", lastMonth, "Approved - materi promosi"],
      ["EXP-003", lastMonth, "Ahmad Fauzi", "Launch Event Vanilla Oud", "Bahan Baku", "Pembelian bahan baku vanilla extract", 3200000, "", "Rejected", "Beriman Juliano", lastMonth, "Rejected - melebihi budget bahan baku"],
      ["EXP-004", today, "Dewi Lestari", "Launch Event Vanilla Oud", "Transport", "Transportasi pengiriman sampel", 750000, "", "Pending", "", "", ""],
      ["EXP-005", today, "Rudi Hartono", "Expo Parfum Jakarta", "Packaging", "Packaging khusus edisi expo", 2100000, "", "Pending", "", "", ""],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Submissions!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: submissions },
    });
    console.log("✅ 5 sample submissions seeded");
  } else {
    console.log("✅  Already have 5+ submissions, skipping seed");
  }

  // Seed approver
  const { data: apprData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A:D",
  });
  const apprRows = apprData.values || [];
  const apprCount = apprRows.length > 1 ? apprRows.length - 1 : 0;

  if (apprCount < 1) {
    console.log("Seeding approver data...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Approvers!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["APR-001", "Beriman Juliano", "Direktur", "beriman@swi.id"]],
      },
    });
    console.log("✅ 1 approver seeded: Beriman Juliano (Direktur)");
  } else {
    console.log("✅  Approver already exists, skipping seed");
  }

  console.log("\n🎉 Expense seeding complete!");
  console.log("📊 Sheets: https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
