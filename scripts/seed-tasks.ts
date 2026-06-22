// Seed task data directly to Google Sheets
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

  // Check if Tasks sheet exists and has data
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingSheets = ss.data.sheets?.map((s: any) => s.properties?.title) || [];
  console.log("Existing sheets:", existingSheets.join(", "));

  // Create Tasks sheet if not exists
  if (!existingSheets.includes("Tasks")) {
    console.log("Creating Tasks sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Tasks" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Tasks!A1:M1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "Task ID", "Title", "Description", "Assignee", "PIC Name",
          "Due Date", "Priority", "Status", "Related Event/Project",
          "Created By", "Created Date", "Completed Date", "Notes",
        ]],
      },
    });
    console.log("✅ Tasks sheet created with headers");
  }

  // Create Task_Comments sheet if not exists
  if (!existingSheets.includes("Task_Comments")) {
    console.log("Creating Task_Comments sheet...");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "Task_Comments" } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Task_Comments!A1:E1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Comment ID", "Task ID", "Author", "Date", "Comment"]],
      },
    });
    console.log("✅ Task_Comments sheet created with headers");
  }

  // Check existing data
  const { data: existingData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Tasks!A:M",
  });

  const existingRows = existingData.values || [];
  if (existingRows.length > 1) {
    console.log(`Tasks sheet already has ${existingRows.length - 1} data rows. Skipping seed.`);
  } else {
    const now = new Date().toISOString().slice(0, 10);
    const pastDate = "2025-12-15";
    const tasks = [
      ["TSK-001", "Laporan Keuangan Q4", "Siapkan laporan keuangan kuartal 4", "Beriman", "Beriman", "2025-12-31", "High", "Done", "Laporan Berunan", "System", "2025-10-01", "2025-12-28", "Selesai tepat waktu"],
      ["TSK-002", "Event Monitoring Jakarta", "Pantau persiapan event monitoring di Jakarta", "Siti Aminah", "Siti Aminah", "2025-12-20", "High", "Done", "Event Monitoring", "System", "2025-11-01", now, "Event berjalan lancar"],
      ["TSK-003", "Update SOP Produksi", "Revisi SOP produksi sesuai standar terbaru", "Ahmad Rizki", "Ahmad Rizki", "2025-12-25", "High", "In Progress", "SOP Revisi", "System", "2025-11-15", "", "Progress 60%"],
      ["TSK-004", "Supplier Evaluation", "Evaluasi performa supplier bahan baku Q4", "Dewi Lestari", "Dewi Lestari", "2025-12-28", "Medium", "In Progress", "Supplier Review", "System", "2025-12-01", "", "3 supplier sudah dievaluasi"],
      ["TSK-005", "QC Checklist Review", "Review dan update QC checklist untuk produk baru", "Beriman", "Beriman", now, "Medium", "Review", "QC Audit", "System", "2025-12-10", "", "Menunggu approval manager"],
      ["TSK-006", "Inventory Audit", "Audit stok gudang akhir bulan", "Rudi Hartono", "Rudi Hartono", "2025-12-22", "Medium", "Todo", "Stock Opname", "System", "2025-12-18", "", "Belum dimulai"],
      ["TSK-007", "Pembaruan Data Customer", "Update database customer CRM divisi Bandung", "Siti Aminah", "Siti Aminah", pastDate, "High", "Todo", "CRM Update", "System", "2025-10-15", "", "Terlambat - perlu tindak lanjut"],
      ["TSK-008", "Training K Baru", "Onboarding dan training untuk karyawan baru produksi", "Ahmad Rizki", "Ahmad Rizki", pastDate, "Medium", "Todo", "HRD Training", "System", "2025-10-20", "", "Terlambat - reschedule"],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Tasks!A:M",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: tasks },
    });
    console.log(`✅ Seeded ${tasks.length} tasks`);
  }

  // Check comments
  const { data: commentData } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Task_Comments!A:E",
  });

  const existingComments = commentData.values || [];
  if (existingComments.length > 1) {
    console.log(`Task_Comments sheet already has ${existingComments.length - 1} data rows. Skipping seed.`);
  } else {
    const comments = [
      ["CMT-001", "TSK-001", "Beriman", "2025-12-28", "Laporan sudah selesai dan direview oleh manajemen"],
      ["CMT-002", "TSK-003", "Ahmad Rizki", "2025-12-10", "Draft SOP sudah selesai, sedang proses review internal"],
      ["CMT-003", "TSK-007", "Dewi Lestari", "2025-12-20", "Perlu follow up dengan tim CRM Bandung untuk data yang belum update"],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Task_Comments!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: comments },
    });
    console.log(`✅ Seeded ${comments.length} comments`);
  }

  console.log("\n🎉 Task Management seed complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
