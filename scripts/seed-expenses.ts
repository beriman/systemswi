/**
 * Seed script for Expense Approval Flow
 * - Creates Expense_Submissions sheet with 5 sample rows (mix status)
 * - Creates Expense_Approvers sheet with 1 approver (Beriman Juliano)
 */
import { execSync } from "child_process";

// We'll use the Google Sheets API directly via a Node script
// Run with: npx tsx scripts/seed-expenses.ts

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

async function main() {
  // Dynamic import for googleapis
  const { google } = await import("googleapis");
  const fs = await import("fs");

  // Load credentials
  let creds;
  try {
    const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    creds = {
      client_id: content.client_id,
      client_secret: content.client_secret,
      refresh_token: content.refresh_token,
      access_token: content.token || content.access_token || "",
      expiry_date: content.expiry_date || content.expiry || 0,
    };
  } catch {
    console.error("Failed to load Google credentials from", TOKEN_PATH);
    process.exit(1);
  }

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

  const existingSheets = (ss.data.sheets || []).map(
    (s: any) => s.properties?.title
  );
  console.log("Existing sheets:", existingSheets);

  // ── Create Expense_Submissions sheet ──
  if (!existingSheets.includes("Expense_Submissions")) {
    console.log("Creating Expense_Submissions sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          { addSheet: { properties: { title: "Expense_Submissions" } } },
        ],
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
    console.log("  ✅ Expense_Submissions sheet created with headers");
  } else {
    console.log("Expense_Submissions already exists, checking for data...");
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Submissions!A:L",
    });
    const rowCount = (data.values || []).length;
    if (rowCount > 1) {
      console.log(`  ℹ️  Already has ${rowCount - 1} data rows. Skipping seed.`);
    } else {
      console.log("  ℹ️  Sheet exists but empty, will seed data.");
    }
  }

  // ── Seed 5 sample submissions ──
  const { data: subData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A:L",
  });
  const subRowCount = (subData.values || []).length;

  if (subRowCount <= 1) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const sampleData = [
      [
        "EXP-001", lastWeek, "Beriman Juliano", "Pekan Raya Jakarta 2026",
        "Sewa Booth", "Sewa booth utama PRJ 2026 - Hall B", 15000000, "",
        "Approved", "Beriman Juliano", lastWeek, "Approved by director",
      ],
      [
        "EXP-002", twoDaysAgo, "Siti Rahmawati", "Pekan Raya Jakarta 2026",
        "Bahan Baku", "Pembelian bahan baku parfum untuk sampel", 3500000, "",
        "Approved", "Beriman Juliano", yesterday, "Approved",
      ],
      [
        "EXP-003", yesterday, "Ahmad Fauzi", "Bazar Ramadhan Mall Taman Anggrek",
        "Iklan", "Biaya iklan digital Instagram & TikTok", 2500000, "",
        "Pending", "", "", "",
      ],
      [
        "EXP-004", yesterday, "Dewi Lestari", "Bazar Ramadhan Mall Taman Anggrek",
        "Transport", "Ongkos kirim merchandise ke venue", 750000, "",
        "Pending", "", "", "",
      ],
      [
        "EXP-005", today, "Rudi Hartono", "Expo Parfum Indonesia 2026",
        "Packaging", "Custom packaging untuk limited edition", 5000000, "",
        "Rejected", "Beriman Juliano", today, "Budget terlalu tinggi, perlu revisi",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Submissions!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: sampleData },
    });
    console.log("  ✅ 5 sample submissions seeded");
  }

  // ── Create Expense_Approvers sheet ──
  if (!existingSheets.includes("Expense_Approvers")) {
    console.log("Creating Expense_Approvers sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          { addSheet: { properties: { title: "Expense_Approvers" } } },
        ],
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
    console.log("  ✅ Expense_Approvers sheet created with headers");
  } else {
    console.log("Expense_Approvers already exists, checking for data...");
  }

  // ── Seed 1 approver ──
  const { data: appData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A:D",
  });
  const appRowCount = (appData.values || []).length;

  if (appRowCount <= 1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Approvers!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "APR-001", "Beriman Juliano", "Direktur", "beriman@systemswi.com",
        ]],
      },
    });
    console.log("  ✅ 1 approver seeded (Beriman Juliano)");
  } else {
    console.log(`  ℹ️  Already has ${appRowCount - 1} approver(s). Skipping seed.`);
  }

  console.log("\n🎉 Expense Approval Flow seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
