/**
 * Seed script for Expense Approval Flow
 * - Creates Expense_Submissions sheet with 5 sample submissions (mix status)
 * - Creates Expense_Approvers sheet with 1 approver: Beriman Juliano (Direktur)
 *
 * Run: npx tsx scripts/seed-expenses.ts
 */

import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

function loadCredentials() {
  // Try file first
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
    // Fall back to env
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;
    if (!client_id || !client_secret || !refresh_token) {
      throw new Error("No Google credentials found");
    }
    return {
      client_id,
      client_secret,
      refresh_token,
      access_token: process.env.GOOGLE_ACCESS_TOKEN || "",
      expiry_date: parseInt(process.env.GOOGLE_EXPIRY_DATE || "0", 10) || 0,
    };
  }
}

async function main() {
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

  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  // Check existing sheets
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingSheets = ss.data.sheets?.map((s) => s.properties?.title) || [];
  console.log("Existing sheets:", existingSheets);

  // Create Expense_Submissions if not exists
  if (!existingSheets.includes("Expense_Submissions")) {
    console.log("Creating Expense_Submissions sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Expense_Submissions" } } }],
      },
    });

    // Write headers
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
    console.log("  Headers written.");
  } else {
    console.log("Expense_Submissions already exists, checking data...");
  }

  // Check if data already exists
  const { data: existingData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A:L",
  });

  const existingRows = existingData.values || [];
  const dataRowCount = existingRows.length > 1 ? existingRows.length - 1 : 0;
  console.log(`  Current data rows: ${dataRowCount}`);

  if (dataRowCount >= 5) {
    console.log("  Seed data already present, skipping submissions seed.");
  } else {
    // Seed 5 sample submissions
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const submissions = [
      [
        "EXP-001", lastWeek, "Beriman Juliano", "Pekan Parfum Indonesia 2026",
        "Sewa Booth", "Sewa booth utama hall A", 3500000, "",
        "Approved", "Beriman Juliano", lastWeek, "Approved — booth premium",
      ],
      [
        "EXP-002", lastWeek, "Siti Rahmawati", "Pekan Parfum Indonesia 2026",
        "Bahan Baku", "Pembelian bahan baku parfum 50 unit", 1250000, "",
        "Approved", "Beriman Juliano", yesterday, "Approved — bulk purchase",
      ],
      [
        "EXP-003", yesterday, "Ahmad Fauzi", "Launch Event Wangi Collection",
        "Iklan", "Iklan Instagram 2 minggu", 2000000, "",
        "Pending", "", "", "",
      ],
      [
        "EXP-004", yesterday, "Dewi Lestari", "Launch Event Wangi Collection",
        "Transport", "Transportasi peralatan event", 750000, "",
        "Pending", "", "", "",
      ],
      [
        "EXP-005", today, "Rizky Pratama", "Pekan Parfum Indonesia 2026",
        "Packaging", "Custom packaging 200 pcs", 1800000, "",
        "Rejected", "Beriman Juliano", today, "Rejected — melebihi budget packaging",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Submissions!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: submissions },
    });
    console.log(`  Seeded ${submissions.length} expense submissions.`);
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
    console.log("  Headers written.");
  } else {
    console.log("Expense_Approvers already exists, checking data...");
  }

  // Check approvers data
  const { data: approversData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A:D",
  });

  const approversRows = approversData.values || [];
  const approversCount = approversRows.length > 1 ? approversRows.length - 1 : 0;
  console.log(`  Current approvers: ${approversCount}`);

  if (approversCount >= 1) {
    console.log("  Approver seed data already present, skipping.");
  } else {
    const approvers = [
      ["APR-001", "Beriman Juliano", "Direktur", "beriman@systemswi.com"],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Approvers!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: approvers },
    });
    console.log(`  Seeded ${approvers.length} approver.`);
  }

  console.log("\n✅ Expense seed complete!");
  console.log("   Submissions: 5 (2 Approved, 2 Pending, 1 Rejected)");
  console.log("   Approvers: 1 (Beriman Juliano — Direktur)");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
