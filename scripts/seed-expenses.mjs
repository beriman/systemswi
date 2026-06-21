// Seed expense data into Google Sheets
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
  console.log("🌱 Seeding expense data...\n");

  // ── Ensure sheets exist ──
  async function ensureSheet(sheetName, headers) {
    const ss = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: "sheets.properties.title",
    });
    const exists = ss.data.sheets?.some((s) => s.properties?.title === sheetName);
    if (exists) {
      console.log(`✅ Sheet "${sheetName}" already exists`);
      return;
    }
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
    console.log(`✅ Created sheet "${sheetName}" with headers`);
  }

  // ── Clear data rows (keep header) ──
  async function clearDataRows(sheetName) {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });
    const rowCount = (data.values || []).length;
    if (rowCount > 1) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:Z${rowCount}`,
      });
      console.log(`🧹 Cleared ${rowCount - 1} data rows from "${sheetName}"`);
    }
  }

  // ── Append rows ──
  async function appendRows(sheetName, rows) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
    console.log(`✅ Appended ${rows.length} rows to "${sheetName}"`);
  }

  // ── Create sheets ──
  await ensureSheet("Expense_Submissions", [
    "Submission ID", "Date", "Submitter Name", "Related Event",
    "Category", "Description", "Amount", "Proof URL",
    "Status", "Reviewed By", "Reviewed Date", "Notes",
  ]);

  await ensureSheet("Expense_Approvers", [
    "Approver ID", "Name", "Role", "Email",
  ]);

  // ── Clear existing data ──
  await clearDataRows("Expense_Submissions");
  await clearDataRows("Expense_Approvers");

  // ── Seed data ──
  const today = new Date().toISOString().slice(0, 10);
  const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

  // 5 sample submissions (mix status)
  const submissions = [
    // 1. Pending
    ["EXP-001", lastMonth, "Wapiq Rizya Zaelan", "Fragrantions Festival 2026", "Sewa Booth", "Sewa booth utama area A", 3500000, "", "Pending", "", "", ""],
    // 2. Pending
    ["EXP-002", twoWeeksAgo, "Beriman Juliano", "Fragrantions Festival 2026", "Iklan", "Instagram ads campaign", 2000000, "", "Pending", "", "", ""],
    // 3. Approved
    ["EXP-003", lastMonth, "Wapiq Rizya Zaelan", "Workshop Parfum DIY", "Bahan Baku", "Bahan baku essential oil", 1500000, "", "Approved", "Beriman Juliano", twoWeeksAgo, "Approved within budget"],
    // 4. Approved
    ["EXP-004", twoWeeksAgo, "Beriman Juliano", "Workshop Parfum DIY", "Transport", "Transportasi speaker", 500000, "", "Approved", "Beriman Juliano", today, "Approved"],
    // 5. Rejected
    ["EXP-005", lastMonth, "Wapiq Rizya Zaelan", "Pop-up Store Mall", "Packaging", "Custom packaging premium", 4500000, "", "Rejected", "Beriman Juliano", twoWeeksAgo, "Over budget perlu revisi"],
  ];

  await appendRows("Expense_Submissions", submissions);

  // 1 approver
  const approvers = [
    ["APR-001", "Beriman Juliano", "Direktur", "beriman@systemswi.com"],
  ];

  await appendRows("Expense_Approvers", approvers);

  console.log("\n🎉 Seed complete!");
  console.log(`   - ${submissions.length} expense submissions (2 pending, 2 approved, 1 rejected)`);
  console.log(`   - ${approvers.length} approver (Beriman Juliano)`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
