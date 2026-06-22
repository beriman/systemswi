// Task Management — Google Sheets helper
import { google } from "googleapis";
import fs from "fs";

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

export const TASK_SHEETS = {
  Tasks: "Tasks",
  TaskComments: "Task_Comments",
};

let cachedAuth: any = null;

function loadCredentialsFromFile() {
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

function loadCredentialsFromEnv() {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;
  if (!client_id || !client_secret || !refresh_token) return null;
  const access_token = process.env.GOOGLE_ACCESS_TOKEN || "";
  return {
    client_id,
    client_secret,
    refresh_token,
    access_token,
    expiry_date: access_token ? (parseInt(process.env.GOOGLE_EXPIRY_DATE || "0", 10) || 0) : 0,
  };
}

function getAuth() {
  if (cachedAuth) return cachedAuth;
  const creds = loadCredentialsFromFile() || loadCredentialsFromEnv();
  if (!creds) {
    throw new Error(
      "Google credentials not found. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN env vars."
    );
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
  cachedAuth = oauth2;
  return cachedAuth;
}

export async function readTaskSheet(sheetName: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return data.values || [];
}

export async function appendTaskRows(sheetName: string, rows: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

export async function updateTaskRow(sheetName: string, rowNumber: number, values: (string | number)[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:M${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function ensureTaskSheet(sheetName: string, headers: string[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const exists = ss.data.sheets?.some((s: any) => s.properties?.title === sheetName);
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:Z1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
}

export async function initializeTaskSheets(): Promise<void> {
  await ensureTaskSheet(TASK_SHEETS.Tasks, [
    "Task ID", "Title", "Description", "Assignee", "PIC Name",
    "Due Date", "Priority", "Status", "Related Event/Project",
    "Created By", "Created Date", "Completed Date", "Notes",
  ]);
  await ensureTaskSheet(TASK_SHEETS.TaskComments, [
    "Comment ID", "Task ID", "Author", "Date", "Comment",
  ]);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function seedTaskData(): Promise<{ tasksAdded: number; commentsAdded: number }> {
  await initializeTaskSheets();

  // Check if Tasks sheet already has data rows
  const existing = await readTaskSheet(TASK_SHEETS.Tasks);
  if (existing.length > 1) {
    const existingIds = new Set(existing.slice(1).map((r) => r[0]));
    const comments = await readTaskSheet(TASK_SHEETS.TaskComments);
    return {
      tasksAdded: existingIds.size,
      commentsAdded: Math.max(0, comments.length - 1),
    };
  }

  const t = today();
  const taskRows: (string | number)[][] = [
    ["TSK-001", "Finalisasi Laporan Q2 2026", "Compile dan review laporan keuangan Q2 dari semua divisi", "Beriman", "Beriman", daysFromNow(14), "High", "Done", "Laporan Keuangan", "System", "2026-06-01", "2026-06-20", "Selesai lebih awal"],
    ["TSK-002", "Revisi Formula Parfum Vanilla Oud", "Adjust rasio vanilla dan oud sesuai feedback panel test", "Siti Aminah", "Siti Aminah", daysFromNow(-3), "High", "In Progress", "R&D Parfum", "Beriman", "2026-06-05", "", "Iterasi ke-3 sedang diuji"],
    ["TSK-003", "Kirim Sample ke BPOM", "Kirim 15 sample produk untuk registrasi BPOM batch Juli", "Ahmad Rizki", "Ahmad Rizki", daysFromNow(7), "High", "In Progress", "Registrasi BPOM", "Beriman", "2026-06-10", "", "Menunggu kelengkapan dokumen"],
    ["TSK-004", "Setup Booth Event Pekan Raya", "Koordinasi venue, deksor, dan merchandise untuk PRJ 2026", "Dewi Lestari", "Dewi Lestari", daysFromNow(21), "Medium", "To Do", "Event Pekan Raya 2026", "Rudi Hartono", "2026-06-12", "", ""],
    ["TSK-005", "Update Data Customer CRM Migrasi", "Migrasi data customer lama ke format baru CRM hub", "Rudi Hartono", "Rudi Hartono", daysFromNow(10), "Medium", "To Do", "CRM Migration", "Beriman", "2026-06-15", "", ""],
    ["TSK-006", "Review Kontrak Supplier Packaging", "Review dan negosiasi ulang kontrak supplier packaging Q3", "Siti Aminah", "Siti Aminah", daysFromNow(5), "Medium", "Review", "Procurement", "Beriman", "2026-06-08", "", "Menunggu counter-offer dari supplier"],
    ["TSK-007", "Buat Konten Marketing Ramadan 2027", "Desain konten dan jadwal posting campaign Ramadan", "Dewi Lestari", "Dewi Lestari", daysFromNow(30), "Low", "Done", "Marketing Campaign", "Beriman", "2026-06-01", "2026-06-18", "Konten sudah di-approve"],
    ["TSK-008", "Audit Stok Gudang Utama", "Stok opname fisik gudang utama Jatiasih", "Ahmad Rizki", "Ahmad Rizki", daysFromNow(-5), "High", "Overdue", "Inventory Audit", "Rudi Hartono", "2026-06-03", "", "Perlu reschedule — tim sedang tidak available"],
  ];

  await appendTaskRows(TASK_SHEETS.Tasks, taskRows);

  const commentRows: (string | number)[][] = [
    ["CMT-001", "TSK-002", "Beriman", t, "Tolong update hasil panel test di sheet Formula sebelum review akhir."],
    ["CMT-002", "TSK-002", "Siti Aminah", t, "Siap, hasil iterasi 3 sudah diupload. Tinggal review saja."],
    ["CMT-003", "TSK-008", "Rudi Hartono", t, "Audit dijadwalkan ulang ke minggu depan. Tim sedang handling klaim supplier."],
  ];

  await appendTaskRows(TASK_SHEETS.TaskComments, commentRows);

  return { tasksAdded: taskRows.length, commentsAdded: commentRows.length };
}
