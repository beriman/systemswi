// Seed expense data — run with: npx ts-node scripts/seed-expenses.ts
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
    console.error("No Google credentials found");
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

  // Ensure sheets exist
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingSheets = ss.data.sheets?.map((s) => s.properties?.title) || [];

  // Create Expense_Submissions if not exists
  if (!existingSheets.includes("Expense_Submissions")) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Expense_Submissions" } } }],
      },
    });
    console.log("✅ Created Expense_Submissions sheet");
  }

  // Create Expense_Approvers if not exists
  if (!existingSheets.includes("Expense_Approvers")) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Expense_Approvers" } } }],
      },
    });
    console.log("✅ Created Expense_Approvers sheet");
  }

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
  console.log("✅ Written headers to Expense_Submissions");

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A1:D1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Approver ID", "Name", "Role", "Email"]],
    },
  });
  console.log("✅ Written headers to Expense_Approvers");

  // Seed 5 sample submissions
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];

  const submissions = [
    ["EXP-001", twoWeeksAgo, "Beriman Juliano", "Fragrantions Launch 2026", "Bahan Baku", "Pembelian bahan baku parfum — essential oils dan alcohol", 2500000, "", "Approved", "Beriman Juliano", lastWeek, "Approved — bahan baku dibutuhkan segera"],
    ["EXP-002", lastWeek, "Wapiq Rizya Zaelan", "Fragrantions Launch 2026", "Sewa Booth", "Sewa booth untuk event launching 3 hari", 3500000, "", "Approved", "Beriman Juliano", twoDaysAgo, "Approved — venue sudah fix"],
    ["EXP-003", twoDaysAgo, "Tim Marketing", "Fragrantions Launch 2026", "Iklan", "Iklan Instagram dan TikTok untuk promosi event", 1200000, "", "Pending", "", "", ""],
    ["EXP-004", yesterday, "Tim Logistik", "Workshop Parfum DIY", "Transport", "Ongkos kirim bahan workshop ke venue", 450000, "", "Pending", "", "", ""],
    ["EXP-005", today, "Tim Produksi", "Workshop Parfum DIY", "Packaging", "Packaging kit workshop — botol, label, kotak", 800000, "", "Rejected", "Beriman Juliano", today, "Rejected — budget packaging sudah melebihi alokasi"],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Submissions!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: submissions },
  });
  console.log("✅ Seeded 5 expense submissions");

  // Seed 1 approver
  const approvers = [
    ["APR-001", "Beriman Juliano", "Direktur", "beriman@swi.id"],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Expense_Approvers!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: approvers },
  });
  console.log("✅ Seeded 1 approver: Beriman Juliano (Direktur)");

  console.log("\n🎉 Expense Approval Flow seed complete!");
  console.log("📊 Expense_Submissions: 5 rows (2 approved, 2 pending, 1 rejected)");
  console.log("👤 Expense_Approvers: 1 row (Beriman Juliano)");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
