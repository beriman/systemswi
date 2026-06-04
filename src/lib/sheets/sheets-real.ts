// Google Sheets helper — baca & tulis ke semua sheet
// Adapted from holding-swi for systemswi
import { google } from "googleapis";
import fs from "fs";

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

// ── Sheet ranges map ──────────────────────────────────────────────
export const SHEETS: Record<string, { range: string; description: string }> = {
  Dashboard:         { range: "Dashboard!A1:F9",              description: "Ringkasan keuangan per divisi" },
  DashboardSetoran:  { range: "Dashboard!A31:G36",            description: "Rekap setoran 30%" },
  RekapSetoran:      { range: "RekapSetoran!A1:F14",          description: "Rekap setoran per bulan" },
  Holding:           { range: "Holding!A1:G5",                description: "Data holding company" },
  PemegangSaham:     { range: "PemegangSaham!A1:G16",         description: "Data pemegang saham" },
  DivisiShareholders:{ range: "DivisiShareholders!A4:F9",     description: "Shareholder per divisi" },
  SukukStore:        { range: "SukukStore!A4:O9",             description: "Info sukuk store" },
  SukukInvestor:     { range: "SukukStore!A12:O26",           description: "Investor sukuk" },
  SukukProyeksi:     { range: "SukukStore!A29:O44",           description: "Proyeksi sukuk" },
  SukukProduk:       { range: "SukukProduk!A6:L13",           description: "Produk sukuk" },
  SukukProdukProj:   { range: "SukukProduk!A22:M34",          description: "Proyeksi produk sukuk" },
  SukukPanduan:      { range: "SukukPanduan!A1:Z50",          description: "Panduan sukuk" },
  SukukTermSheet:    { range: "Sukuk_Term_Sheet!A1:Z30",     description: "Term sheet sukuk" },
  SukukCreditor:     { range: "Sukuk_Creditor!A1:Z20",        description: "Data creditor" },
  SukukRAB:          { range: "Sukuk_RAB!A1:Z30",            description: "RAB sukuk" },
  SukukSchedule:     { range: "Sukuk_Payment_Schedule!A1:L25", description: "Jadwal pembayaran sukuk" },
  SukukNotification: { range: "Sukuk_Notification!A1:H50",    description: "Notifikasi sukuk" },
  SukukAudit:        { range: "Sukuk_Audit!A1:H50",          description: "Audit trail sukuk" },
  RekeningKoran:     { range: "Rekening_Koran!A5:D7",         description: "Rekening koran header" },
  RekeningMutasi:    { range: "Rekening_Koran!A10:L12",      description: "Mutasi rekening" },
  RekapRekening:     { range: "Rekap_Rekening!A1:H20",       description: "Rekap rekening 8 bulan" },
  COA:               { range: "COA!A5:E60",                   description: "Chart of accounts" },
  CashHarian:        { range: "Cash_Harian!A5:I100",          description: "Cash harian (bank)" },
  BukuKas:           { range: "Buku_Kas!A5:H100",             description: "Buku kas (manual)" },
  LaporanBulanan:    { range: "Laporan_Bulanan!A1:P16",       description: "Laporan bulanan" },
  BudgetVsActual:    { range: "Budget_vs_Actual!A1:R50",      description: "Budget vs actual" },
  PajakTracking:     { range: "Pajak_Tracking!A1:H12",        description: "Tracking pajak" },
  LegalCompliance:   { range: "Legal_Compliance!A1:H16",       description: "Legal compliance" },
  CashflowForecast:  { range: "Cashflow_Forecast!A1:J30",     description: "Cashflow forecast" },
  CashflowAktual:    { range: "Cashflow_Aktual!A1:I80",       description: "Cashflow aktual" },
  BreakEven:         { range: "Break_Even_Analysis!A1:J16",   description: "Break even analysis" },
  Proyeksi12Bulan:   { range: "Proyeksi_12Bulan!A1:O25",      description: "Proyeksi 12 bulan" },
  Produksi:          { range: "Produksi!A1:Z100",             description: "Data produksi" },
};

// ── Auth ──────────────────────────────────────────────────────────
let cachedAuth: any = null;

function loadCredentialsFromFile() {
  try {
    const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    return {
      client_id: content.client_id,
      client_secret: content.client_secret,
      refresh_token: content.refresh_token,
      access_token: content.token || content.access_token || "",
      expiry_date: content.expiry_date || Date.now() + 3600000,
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
  return {
    client_id,
    client_secret,
    refresh_token,
    access_token: process.env.GOOGLE_ACCESS_TOKEN || "",
    expiry_date: parseInt(process.env.GOOGLE_EXPIRY_DATE || "0", 10) || Date.now() + 3600000,
  };
}

export function getAuth() {
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
  return oauth2;
}

export function invalidateAuth() {
  cachedAuth = null;
}

// ── Read ──────────────────────────────────────────────────────────
export async function readRange(range: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return data.values || [];
}

export async function readSheet(sheetName: string): Promise<string[][]> {
  const cfg = SHEETS[sheetName];
  if (!cfg) throw new Error(`Unknown sheet: ${sheetName}`);
  return readRange(cfg.range);
}

export async function readRanges(ranges: string[]): Promise<Record<string, string[][]>> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges,
  });
  const result: Record<string, string[][]> = {};
  (data.valueRanges || []).forEach((vr, i) => {
    result[ranges[i]] = vr.values || [];
  });
  return result;
}

// ── Write ─────────────────────────────────────────────────────────
export async function writeRange(range: string, values: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

export async function appendRows(sheetName: string, rows: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const cfg = SHEETS[sheetName];
  const match = cfg?.range?.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  let appendRange = `${sheetName}!A:Z`;
  if (match) {
    appendRange = `${sheetName}!${match[1]}:${match[3]}`;
  }
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: appendRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

export async function updateRow(sheetName: string, rowNumber: number, values: (string | number)[]): Promise<void> {
  const cfg = SHEETS[sheetName];
  if (!cfg) throw new Error(`Unknown sheet: ${sheetName}`);
  const match = cfg.range.match(/^([A-Z]+)\d+:([A-Z]+)\d+$/);
  const colStart = match ? match[1] : "A";
  const colEnd = match ? match[2] : "Z";
  const range = `${sheetName}!${colStart}${rowNumber}:${colEnd}${rowNumber}`;
  await writeRange(range, [values]);
}

export async function deleteRow(sheetName: string, rowNumber: number): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });
  const sheetId = ss.data.sheets?.find(
    (s: any) => s.properties?.title === sheetName
  )?.properties?.sheetId;

  if (sheetId === undefined) throw new Error(`Sheet "${sheetName}" not found`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: "ROWS",
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      }],
    },
  });
}
