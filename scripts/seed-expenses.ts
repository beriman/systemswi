/**
 * Seed script for Expense Approval Flow
 * - Creates Expense_Submissions sheet with headers + 5 sample rows
 * - Creates Expense_Approvers sheet with headers + 1 approver (Beriman Juliano)
 *
 * Run: npx tsx scripts/seed-expenses.ts
 */

import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_ID ||
  "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
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
  } catch {}
  // Fallback to env
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

  // ── Check existing sheets ──
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const existingSheets = (ss.data.sheets || []).map(
    (s: any) => s.properties?.title
  );

  console.log("Existing sheets:", existingSheets);

  // ── 1. Expense_Submissions ──
  const submissionsSheet = "Expense_Submissions";
  const submissionsHeaders = [
    "Submission ID",
    "Date",
    "Submitter Name",
    "Related Event",
    "Category",
    "Description",
    "Amount",
    "Proof URL",
    "Status",
    "Reviewed By",
    "Reviewed Date",
    "Notes",
  ];

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000)
    .toISOString()
    .slice(0, 10);

  const sampleSubmissions = [
    [
      "EXP-001",
      today,
      "Beriman Juliano",
      "Pekan Produk Lokal 2026",
      "Sewa Booth",
      "Sewa booth utama 3x2m di hall A",
      3500000,
      "",
      "Pending",
      "",
      "",
      "Menunggu approval direktur",
    ],
    [
      "EXP-002",
      yesterday,
      "Siti Rahmawati",
      "Pekan Produk Lokal 2026",
      "Bahan Baku",
      "Pembelian bahan baku parfum — essential oil rose",
      1250000,
      "",
      "Approved",
      "Beriman Juliano",
      today,
      "Approved — sesuai budget",
    ],
    [
      "EXP-003",
      lastWeek,
      "Ahmad Fauzi",
      "Expo UMKM Jawa Barat",
      "Transport",
      "Ongkos kirim booth + barang dari Bandung ke Jakarta",
      750000,
      "",
      "Approved",
      "Beriman Juliano",
      yesterday,
      "Approved — biaya wajar",
    ],
    [
      "EXP-004",
      lastWeek,
      "Dewi Lestari",
      "Expo UMKM Jawa Barat",
      "Iklan",
      "Biaya iklan Instagram promotion 2 minggu",
      2000000,
      "",
      "Rejected",
      "Beriman Juliano",
      lastWeek,
      "Rejected — melebihi budget iklan, perlu revisi",
    ],
    [
      "EXP-005",
      twoWeeksAgo,
      "Rizky Pratama",
      "Pekan Produk Lokal 2026",
      "Packaging",
      "Kemasan khusus edisi event — 500 pcs",
      1800000,
      "",
      "Pending",
      "",
      "",
      "Menunggu review",
    ],
  ];

  if (!existingSheets.includes(submissionsSheet)) {
    console.log(`Creating sheet: ${submissionsSheet}`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          { addSheet: { properties: { title: submissionsSheet } } },
        ],
      },
    });
    // Write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${submissionsSheet}!A1:L1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [submissionsHeaders] },
    });
    console.log("Headers written.");
  } else {
    console.log(`Sheet ${submissionsSheet} already exists.`);
  }

  // Check if data already exists
  const { data: existingData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${submissionsSheet}!A:L`,
  });
  const existingRows = existingData.values || [];

  if (existingRows.length > 1) {
    console.log(
      `Expense_Submissions already has ${existingRows.length - 1} data rows. Skipping seed.`
    );
  } else {
    // Append sample data
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${submissionsSheet}!A:L`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: sampleSubmissions },
    });
    console.log(`✅ Seeded ${sampleSubmissions.length} expense submissions.`);
  }

  // ── 2. Expense_Approvers ──
  const approversSheet = "Expense_Approvers";
  const approversHeaders = [
    "Approver ID",
    "Name",
    "Role",
    "Email",
  ];
  const sampleApprovers = [
    [
      "APR-001",
      "Beriman Juliano",
      "Direktur",
      "beriman@swi.co.id",
    ],
  ];

  if (!existingSheets.includes(approversSheet)) {
    console.log(`Creating sheet: ${approversSheet}`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          { addSheet: { properties: { title: approversSheet } } },
        ],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${approversSheet}!A1:D1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [approversHeaders] },
    });
    console.log("Headers written.");
  } else {
    console.log(`Sheet ${approversSheet} already exists.`);
  }

  // Check if approver data exists
  const { data: existingApprovers } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${approversSheet}!A:D`,
  });
  const existingApproverRows = existingApprovers.values || [];

  if (existingApproverRows.length > 1) {
    console.log(
      `Expense_Approvers already has ${existingApproverRows.length - 1} data rows. Skipping seed.`
    );
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${approversSheet}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: sampleApprovers },
    });
    console.log(
      `✅ Seeded ${sampleApprovers.length} approver: Beriman Juliano (Direktur)`
    );
  }

  console.log("\n🎉 Expense Approval Flow seed complete!");
  console.log(`   Submissions: ${submissionsSheet}`);
  console.log(`   Approvers: ${approversSheet}`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
