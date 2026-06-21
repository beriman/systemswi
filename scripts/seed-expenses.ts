// Seed expense data to Google Sheets
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
    console.log("✅ Headers written");
  } else {
    console.log("✅ Expense_Submissions already exists");
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
    console.log("✅ Approvers headers written");
  } else {
    console.log("✅ Expense_Approvers already exists");
  }

  // Seed 5 sample submissions
  console.log("\nSeeding 5 sample expense submissions...");
  const submissions = [
    ["EXP-001", "2026-06-15", "Wapiq Rizya Zaelan", "Fragrantions 2026", "Iklan", "Pembuatan banner Instagram untuk Road to Fragrantions", 750000, "", "Approved", "Beriman Juliano", "2026-06-16", "Disetujui — sudah sesuai budget marketing"],
    ["EXP-002", "2026-06-18", "Beriman Juliano", "Fragrantions 2026", "Transport", "Ongkir pengiriman merchandise SWI ke venue expo", 1250000, "", "Approved", "Beriman Juliano", "2026-06-18", "Self-approved sebagai Direktur"],
    ["EXP-003", "2026-06-20", "Wapiq Rizya Zaelan", "Fragrantions 2026", "Sewa Booth", "DP booking venue Jakarta Convention Center", 50000000, "", "Pending", "", "", ""],
    ["EXP-004", "2026-06-19", "Tim Produksi", "SWI Store TIM", "Bahan Baku", "Pembelian perlengkapan produksi parfum batch #007", 3200000, "", "Pending", "", "", ""],
    ["EXP-005", "2026-06-17", "Beriman Juliano", "SWI Store TIM", "Lainnya", "Konsumsi rapat bulanan divisi Store", 450000, "", "Rejected", "Beriman Juliano", "2026-06-18", "Ditolak — bukan prioritas bulan ini"],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: submissions },
  });
  console.log("✅ 5 submissions seeded");

  // Seed approver
  console.log("\nSeeding approver...");
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["APR-001", "Beriman Juliano", "Direktur", "beriman@sensasiwangi.id"]],
    },
  });
  console.log("✅ 1 approver seeded");

  // Verify
  console.log("\n📊 Verifying...");
  const subData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A1:L10",
  });
  console.log(`Expense_Submissions: ${(subData.data.values || []).length} rows (including header)`);

  const aprData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A1:D5",
  });
  console.log(`Expense_Approvers: ${(aprData.data.values || []).length} rows (including header)`);

  console.log("\n🎉 Seed complete!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
