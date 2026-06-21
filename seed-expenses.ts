// Seed script for Expense Approval Flow
import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_ID ||
  "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
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

async function main() {
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

  // Step 1: Check existing sheets
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const existingSheets = (ss.data.sheets || []).map(
    (s: any) => s.properties?.title as string
  );
  console.log("Existing sheets:", existingSheets.length);

  // Step 2: Create Expense_Submissions if not exists
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
    console.log("  Headers written");
  } else {
    console.log("Expense_Submissions already exists");
  }

  // Step 3: Create Expense_Approvers if not exists
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
    console.log("  Headers written");
  } else {
    console.log("Expense_Approvers already exists");
  }

  // Step 4: Seed 5 sample submissions
  const existingData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A:L",
  });
  const existingRows = existingData.data.values || [];
  const hasData = existingRows.length > 1;

  if (!hasData) {
    console.log("Seeding 5 sample expense submissions...");
    const sampleSubmissions = [
      ["EXP-001", "2026-06-15", "Beriman Juliano", "Pekan Produk Nasional 2026",
       "Sewa Booth", "Sewa booth utama hall A3, 3 hari", 8500000, "",
       "Approved", "Beriman Juliano", "2026-06-16", "Approved sesuai budget"],
      ["EXP-002", "2026-06-17", "Siti Aminah", "Pekan Produk Nasional 2026",
       "Bahan Baku", "Pembelian bahan parfum konsentrat 5L", 3200000, "",
       "Approved", "Beriman Juliano", "2026-06-18", "Approved harga sesuai PO"],
      ["EXP-003", "2026-06-19", "Ahmad Rizki", "Launching Wangi Series Baru",
       "Iklan", "Iklan Instagram Stories 1 minggu", 1500000, "",
       "Pending", "", "", ""],
      ["EXP-004", "2026-06-20", "Dewi Lestari", "Launching Wangi Series Baru",
       "Packaging", "Pembelian botol parfum 50ml x 200 pcs", 2800000, "",
       "Pending", "", "", ""],
      ["EXP-005", "2026-06-10", "Rudi Hartono", "Event Bazar Ramadhan",
       "Transport", "Ongkir pengiriman barang ke lokasi event", 750000, "",
       "Rejected", "Beriman Juliano", "2026-06-11", "Rejected tidak ada event"],
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Submissions!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: sampleSubmissions },
    });
    console.log("  5 sample submissions inserted");
  } else {
    console.log(`  Already has ${existingRows.length - 1} rows, skipping seed`);
  }

  // Step 5: Seed approver
  const approversData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A:D",
  });
  const approversRows = approversData.data.values || [];
  if (approversRows.length <= 1) {
    console.log("Seeding approver...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Expense_Approvers!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["APR-001", "Beriman Juliano", "Direktur", "beriman@sensasiwangi.com"]],
      },
    });
    console.log("  1 approver seeded (Beriman Juliano)");
  } else {
    console.log(`  Already has ${approversRows.length - 1} approver(s), skipping seed`);
  }

  // Step 6: Verify
  const verifyData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A2:A",
  });
  const submissionCount = (verifyData.data.values || []).length;
  console.log(`\nVerification: ${submissionCount} expense submissions in sheet`);
  console.log("Seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
