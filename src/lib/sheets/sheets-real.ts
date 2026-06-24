// Google Sheets helper — baca & tulis ke semua sheet
// Adapted from holding-swi for systemswi
import { google } from "googleapis";
import fs from "fs";

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

// ── Sheet ranges map ──────────────────────────────────────────────
export const SHEETS: Record<string, { range: string; description: string }> = {
  Dashboard:         { range: "Dashboard!A1:F9",              description: "Ringkasan keuangan per divisi" },
  DashboardSetoran:  { range: "Dashboard!A31:G36",            description: "Rekap setoran 30%" },
  RekapSetoran:      { range: "RekapSetoran!A1:F14",          description: "Rekap setoran per bulan" },
  Holding:           { range: "Holding!A1:G5",                description: "Data holding company" },
  PemegangSaham:     { range: "PemegangSaham!A1:I16",         description: "Data pemegang saham" },
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
  RekeningKoran:     { range: "Rekening_Koran!A5:E28",        description: "Rekening koran header + saldo" },
  RekeningMutasi:    { range: "Rekening_Koran!A10:L28",      description: "Mutasi rekening (debet/kredit)" },
  RekapRekening:     { range: "Rekap_Rekening!A1:H40",       description: "Rekap rekening 8 bulan (2 akun)" },
  COA:               { range: "COA!A5:E60",                   description: "Chart of accounts" },
  CashHarian:        { range: "Cash_Harian!A5:I100",          description: "Cash harian (bank)" },
  BukuKas:           { range: "Buku_Kas!A5:H100",             description: "Buku kas (manual)" },
  LaporanBulanan:    { range: "Laporan_Bulanan!A1:P16",       description: "Laporan bulanan" },
  BudgetVsActual:    { range: "Budget_vs_Actual!A1:R500",     description: "Budget vs actual" },
  BudgetCategories:  { range: "Budget_Categories!A1:D50",      description: "Budget categories master" },
  PajakTracking:     { range: "Pajak_Tracking!A1:H12",        description: "Tracking pajak" },
  LegalCompliance:   { range: "Legal_Compliance!A1:H16",       description: "Legal compliance" },
  CashflowForecast:  { range: "Cashflow_Forecast!A1:J30",     description: "Cashflow forecast" },
  CashflowAktual:    { range: "Cashflow_Aktual!A1:I80",       description: "Cashflow aktual" },
  BreakEven:         { range: "Break_Even_Analysis!A1:J16",   description: "Break even analysis" },
  BEPCalculations:   { range: "BEP_Calculations!A1:L100",     description: "BEP calculations per brand" },
  Proyeksi12Bulan:   { range: "Proyeksi_12Bulan!A1:O25",      description: "Proyeksi 12 bulan" },
  Produksi:          { range: "Produksi!A1:Z100",             description: "Data produksi" },
  BrandMaster:       { range: "Brand_Master!A1:K200",         description: "Master brand dan template brand" },
  BrandProduction:   { range: "Brand_Production!A1:T1000",    description: "Pelaporan produksi per brand" },
  BrandSales:        { range: "Brand_Sales!A1:N1000",         description: "Selling / penjualan per brand" },
  BrandExpenses:     { range: "Brand_Expenses!A1:L1000",      description: "Pengeluaran per brand" },
  BrandDashboard:    { range: "Brand_Dashboard!A1:C50",       description: "Ringkasan analisa brand" },
  InventoryMaster:   { range: "Inventory_Master!A1:O1000",     description: "Master stok bahan baku dan packaging" },
  InventoryMovements:{ range: "Inventory_Movements!A1:J1000",  description: "Mutasi stok masuk/keluar/adjustment" },
  SupplierMaster:    { range: "Supplier_Master!A1:J1000",       description: "Master supplier bahan baku, packaging, dan vendor operasional" },
  PurchaseOrders:    { range: "Purchase_Orders!A1:N1000",       description: "Purchase order procurement dan status pembayaran/penerimaan" },
  GoodsReceipts:     { range: "Goods_Receipts!A1:M1000",        description: "Receiving goods dan QC intake linked ke inventory" },
  ReorderAlerts:     { range: "Reorder_Alerts!A1:L1000",        description: "Auto-generated reorder alerts dari inventory check" },
  CustomerMaster:    { range: "Customer_Master!A1:M1000",       description: "Master customer CRM, consent, segment, dan CLV" },
  CustomerInteractions:{ range: "Customer_Interactions!A1:J1000", description: "Customer touchpoints, WhatsApp intake, purchase, dan follow-up" },
  ComplianceChecks:  { range: "Compliance_Checks!A1:L1000",     description: "Formula compliance checks, allergen labels, IFRA/BPOM notes" },
  ProductBatches:    { range: "Product_Batches!A1:M1000",       description: "Batch traceability for finished products" },
  QCChecklist:       { range: "QC_Checklist!A1:I1000",          description: "QC checklist results per batch and stage" },
  QC_Results:        { range: "QC_Results!A1:N1000",            description: "QC results per batch — scores and status" },
  AgentAuditLog:     { range: "Agent_Audit_Log!A1:H10000",      description: "Agent action audit trail — all agent actions logged here" },
  AgentApprovals:    { range: "Agent_Approvals!A1:J5000",       description: "Pending and resolved approval requests from agents" },
  ProductionWaste:   { range: "Production_Waste!A1:K1000",      description: "Waste/reject tracking per batch" },
  ProductionTargets: { range: "Production_Targets!A1:F1000",    description: "Monthly production targets per brand" },
  Ecommerse:         { range: "Ecommerse!A1:Z1000",            description: "E-commerce transactions (online orders)" },
  EcommerseMetrics:  { range: "Ecommerse_Metrics!A1:Z100",     description: "E-commerce aggregated metrics" },
  MerchTIM:          { range: "Merch_TIM!A1:L1000",           description: "Merchandise TIM product catalog" },
  StoreDaily:        { range: "Store_Daily!A1:J1000",         description: "Store daily sales log (structured)" },
  StoreDailyLog:     { range: "Store_Daily_Log!A1:J1000",     description: "Store daily sales log (legacy)" },
  EventBudget:       { range: "Event_Budget!A1:H1000",        description: "Event budget tracking" },
  EventTenants:      { range: "Event_Tenants!A1:J1000",       description: "Event tenant/brand participation" },
  EventSponsors:     { range: "Event_Sponsors!A1:J1000",      description: "Event sponsor management" },
  Formula_Master:      { range: "Formula_Master!A1:L1000",       description: "Master formula/resep parfum" },
  Formula_Ingredients: { range: "Formula_Ingredients!A1:J1000",  description: "Komposisi bahan per formula" },
  Formula_Cost_Summary:{ range: "Formula_Cost_Summary!A1:I1000",  description: "Ringkasan cost per formula" },
  ExpenseSubmissions:{ range: "Expense_Submissions!A1:L1000",    description: "Expense submissions dengan approval flow" },
  ExpenseApprovers:{ range: "Expense_Approvers!A1:D100",         description: "List approver expense" },
  SalesTargets:      { range: "Sales_Targets!A1:K1000",            description: "Sales targets per brand per month" },
  SalesActuals:      { range: "Sales_Actuals!A1:J1000",            description: "Actual sales transactions" },
  Tasks:             { range: "Tasks!A1:M1000",                   description: "Task management — master task tracker" },
  TaskComments:      { range: "Task_Comments!A1:E1000",            description: "Task comments" },

  // ── Aliases used by API routes (match appendRows/updateRow sheetName args) ──
  ReorderAlerts:     { range: "Reorder_Alerts!A1:L1000",          description: "Reorder alerts — alias for Reorder_Alerts" },
};

// ── Auth ──────────────────────────────────────────────────────────
let cachedAuth: any = null;

// ── Read cache ────────────────────────────────────────────────────
// Most workspace pages aggregate the same Google Sheets ranges repeatedly.
// A short in-memory TTL keeps Google Sheets as source of truth while reducing
// API latency/rate-limit pressure for dashboards and cron probes.
const READ_CACHE_TTL_MS = Number.parseInt(process.env.SHEETS_READ_CACHE_TTL_MS || "30000", 10);
type CacheEntry = { expiresAt: number; values: string[][] };
const readCache = new Map<string, CacheEntry>();

function cloneRows(rows: string[][]): string[][] {
  return rows.map((row) => [...row]);
}

function getCachedRows(cacheKey: string): string[][] | null {
  if (READ_CACHE_TTL_MS <= 0) return null;
  const cached = readCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    readCache.delete(cacheKey);
    return null;
  }
  return cloneRows(cached.values);
}

function setCachedRows(cacheKey: string, rows: string[][]): void {
  if (READ_CACHE_TTL_MS <= 0) return;
  readCache.set(cacheKey, {
    expiresAt: Date.now() + READ_CACHE_TTL_MS,
    values: cloneRows(rows),
  });
}

function invalidateReadCache(): void {
  readCache.clear();
}

function loadCredentialsFromFile() {
  try {
    const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    return {
      client_id: content.client_id,
      client_secret: content.client_secret,
      refresh_token: content.refresh_token,
      access_token: content.token || content.access_token || "",
      // Hermes' Google token file stores expiry under either `expiry` or
      // `expiry_date` depending on the OAuth flow. If we don't pass the real
      // expiry, google-auth-library can keep using an expired access token and
      // Sheets reads fail with 401 Invalid Credentials.
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

function loadServiceAccount() {
  // 1. Try base64-encoded JSON from env (Vercel / cloud deployments)
  const saB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saB64) {
    try {
      const decoded = Buffer.from(saB64, "base64").toString("utf-8");
      if (decoded.trim().startsWith("{")) {
        const sa = JSON.parse(decoded);
        if (sa.type === "service_account") return sa;
      }
    } catch {
      // fall through
    }
    try {
      const sa = JSON.parse(saB64);
      if (sa.type === "service_account") return sa;
    } catch {
      // fall through
    }
  }

  // 2. Try file path from env (local / self-hosted)
  const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (saPath) {
    try {
      const raw = fs.readFileSync(saPath, "utf-8");
      const sa = JSON.parse(raw);
      if (sa.type === "service_account") return sa;
    } catch {
      // fall through
    }
  }

  // 3. Embedded fallback (for Vercel standalone builds where env vars may not propagate)
  try {
    const EMBEDDED_SA = JSON.parse(process.env.SA_EMBEDDED_JSON || "null");
    if (EMBEDDED_SA && EMBEDDED_SA.type === "service_account") return EMBEDDED_SA;
  } catch {
    // fall through
  }

  // 4. Hardcoded Service Account (ultimate fallback — always works in Vercel)
  const HARDCODED_SA = {
  "type": "service_account",
  "project_id": "hemuhemu",
  "private_key_id": "1b985a16bb3eada41d0f7efb502b17d5eb7a3e62",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUxgegMeCANjgB\ni1zY+PgAx0yhP8UrTWA4t0ML25G8pKsUHMXYc4pdlpMXbOaOlhaMGDyYFNTMwq5U\nUCxFxtg07TaYokDprlLmr+3aVnvGVngOAz/qpQaZG/mMB4XL+o6W9U8cqiygK0Uy\nuFOOflpB5AlM4bNWelkeO33iA6RPZdnfVB83/JVPFmU1uFdffpi9WOi7Ue9KrJnA\nh9qrj8eARZOcNvEz6pSD0nScWn71tOtCHPH+gat/rWBVEjO4t0HUCh9qoJYEleJK\nS2GHnxXY4zXrcXb9mSt5ZDwmrp10I+sUnQC/IKmliMQecSqXGbejTiT/Gc677IPb\nBe2SFuUDAgMBAAECggEAGFfXw4IxVzncyoBxTPmfFie3IrOzETM3EQYWi6LBV73X\nPOPV1t/RMsfpaEKzVhjh14FmXVf0yMB1RXwutIT9c4C4QFo/5vxky7PRGKvQWW7H\nKYNBqszapmXG9ThfHGk8KxVBydvGY0TQE+92z9Sw6tz2G2+vHvO8gnL4AgW8pMCi\n2sKYR6dBePBF9DedgE//PouiY1lB2vk902ua99VlhBFPpXr8k7TwLp207um0lvWw\nogMD49QCqEz5z8XwQLhtpMpqbLWb0iKtyeNiZoEiV9g2pwZHPazbvNLmMxkRWMow\neuf/sOyZRve/TD5ENgZoip48f68VTAt9rwtxy4uzgQKBgQD4742mbhnseLt+dr5b\nj71FeFxNxbVZU3hI8mdguYZjuRzKlh2vQhtwS7vmpBKuUy3UqTtX9Vin/gHdprXW\ny+eK4JLQ5M5y3T770rimB0EgGTxuPawFVdZTUXr/wmwdSl7uxFhFcSaob3MKRlTw\n60suWWOHxyAoBs75m5Fd+JjpYQKBgQDaz8S6rM/Xvg3p8Er6pzYKDLCkAfu72xoR\nJB3vwYq+V424VdVy4ZLrAvddIAAiAfr7Sx3mjejPMI9fjp3qY4kYfQ7bj5Weaqa6\nVe/c9v5mhZcgM7bj5cKo2GfekX1HWuHTpYo5qxt1GwJS8G8+gmeuDyo3rogyT8D0\nexkH0MB04wKBgQCCag3NqVTPfBjOEit8EHvaD0pcPD3bxEz5+nSKSefMCsi4oZh/\nnqR9Wk/gbwiSZ2VVSiua0yBVMk+L7bDKDR0Ktshzw8schihfCXBPGvHVfSMZphme\n2e9kywUjRJobZkEB2b9c8gCMsYaVVW9eoAZNC+uG0J1aGucIAaZQktKZQQKBgQC3\nOU+E+Xw5Ld48zIgch7QKikHHtBl1XqzfOZ0PzMM/S9VSTB2mSxlZTWyRQGCcGYhu\nsKHjE2WlSQZlf+jgAmUkamPsmrkwpCHk2l02bGTuuGKqBmPZReXQuRWRG8cJ3yJG\ntdGfJJajYvB5PvgIIe5rpCs34SAO8RWkIwf8sWLW/QKBgA9PJLlXZ5cESa+KZ/Wk\nmZysM/K/cS3J8guoZDQpoSdH/cvo3wvxko2sDoMLf6E9JiyEKEqLZXclZ1m37Yxy\nfr1ytZ94MtDtcK38EmknxPsedM8Pj+lVPOfS93t69Q8Vgap/Lp/YhiXc5uLmXZTp\nvZVsc1AOIngkitseMFF3P8B7\n-----END PRIVATE KEY-----\n",
  "client_email": "swi-system@hemuhemu.iam.gserviceaccount.com",
  "client_id": "106278358112674746608",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/swi-system%40hemuhemu.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
  return HARDCODED_SA;
}

export function getAuth() {
  if (cachedAuth) return cachedAuth;

  // ── Service Account (unlimited, no expiry) ─────────────────────────
  const sa = loadServiceAccount();
  if (sa) {
    const jwtAuth = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
      ],
    });
    cachedAuth = jwtAuth;
    return jwtAuth;
  }

  // ── OAuth (existing fallback) ──────────────────────────────────────
  const creds = loadCredentialsFromFile() || loadCredentialsFromEnv();
  if (!creds) {
    throw new Error(
      "Google credentials not found. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN env vars, or GOOGLE_SERVICE_ACCOUNT_PATH."
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
  invalidateReadCache();
}

// ── Read ──────────────────────────────────────────────────────────
export async function readRange(range: string): Promise<string[][]> {
  const cacheKey = `range:${range}`;
  const cached = getCachedRows(cacheKey);
  if (cached) return cached;

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  const rows = data.values || [];
  setCachedRows(cacheKey, rows);
  return cloneRows(rows);
}

export async function readSheet(sheetName: string): Promise<string[][]> {
  const cfg = SHEETS[sheetName];
  if (!cfg) throw new Error(`Unknown sheet: ${sheetName}`);
  return readRange(cfg.range);
}

export async function readRanges(ranges: string[]): Promise<Record<string, string[][]>> {
  const result: Record<string, string[][]> = {};
  const missingRanges: string[] = [];

  for (const range of ranges) {
    const cached = getCachedRows(`range:${range}`);
    if (cached) {
      result[range] = cached;
    } else {
      missingRanges.push(range);
    }
  }

  if (missingRanges.length === 0) return result;

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: missingRanges,
  });
  (data.valueRanges || []).forEach((vr, i) => {
    const range = missingRanges[i];
    const rows = vr.values || [];
    setCachedRows(`range:${range}`, rows);
    result[range] = cloneRows(rows);
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
  invalidateReadCache();
}

export async function appendRows(sheetName: string, rows: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const cfg = SHEETS[sheetName];
  const rangeConfig = cfg?.range || `${sheetName}!A:Z`;
  const rangeMatch = rangeConfig.match(/^(?:([^!]+)!)?([A-Z]+)\d+:([A-Z]+)\d+$/);
  const actualSheetName = rangeMatch?.[1] || sheetName;
  const appendRange = rangeMatch
    ? `${actualSheetName}!${rangeMatch[2]}:${rangeMatch[3]}`
    : `${actualSheetName}!A:Z`;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: appendRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
  invalidateReadCache();
}

export async function updateRow(sheetName: string, rowNumber: number, values: (string | number)[]): Promise<void> {
  const cfg = SHEETS[sheetName];
  if (!cfg) throw new Error(`Unknown sheet: ${sheetName}`);
  const match = cfg.range.match(/^(?:([^!]+)!)?([A-Z]+)\d+:([A-Z]+)\d+$/);
  const actualSheetName = match?.[1] || sheetName;
  const colStart = match ? match[2] : "A";
  const colEnd = match ? match[3] : "Z";
  const range = `${actualSheetName}!${colStart}${rowNumber}:${colEnd}${rowNumber}`;
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
  invalidateReadCache();
}
