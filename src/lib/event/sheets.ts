// Google Sheets integration for Event Management (Fragrantions)
// PIC: Wapiq Rizya Zaelan
// Uses the same Google OAuth token as the main SWI spreadsheet
// ⚠️ SERVER-ONLY: Never import from client components
import "server-only";
import { google } from "googleapis";
import fs from "fs";

// We'll use a separate spreadsheet for events
// For now, we'll create sheets within the existing spreadsheet
// Later can be migrated to a dedicated Fragrantions spreadsheet
export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

// ── Sheet names for Event Management ──
export const EVENT_SHEETS = {
  Events: "Events",
  Budget: "Event_Budget",
  Tenants: "Event_Tenants",
  Sponsors: "Event_Sponsors",
  Timeline: "Event_Timeline",
  Dashboard: "Event_Dashboard",
  Media: "Event_Media",
};

// ── Auth (reuse from sheets-real) ──
// googleapis does not expose a compact shared credential union here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedAuth: any = null;

// ── Read cache ────────────────────────────────────────────────────
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
  return {
    client_id,
    client_secret,
    refresh_token,
    access_token: process.env.GOOGLE_ACCESS_TOKEN || "",
    expiry_date: process.env.GOOGLE_ACCESS_TOKEN
      ? (parseInt(process.env.GOOGLE_EXPIRY_DATE || "0", 10) || 0)
      : 0,
  };
}

function loadServiceAccount() {
  // Try env first
  const saB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saB64) {
    try {
      const decoded = Buffer.from(saB64, "base64").toString("utf-8");
      if (decoded.trim().startsWith("{")) {
        const sa = JSON.parse(decoded);
        if (sa.type === "service_account") return sa;
      }
    } catch { /* fall through */ }
    try {
      const sa = JSON.parse(saB64);
      if (sa.type === "service_account") return sa;
    } catch { /* fall through */ }
  }
  // Try /hermes/google/ fallback (outside src/ tree)
  try {
    const raw = fs.readFileSync("/home/ubuntu/.hermes/google/swi-system-sa.json", "utf-8");
    const sa = JSON.parse(raw);
    if (sa?.type === "service_account") return sa;
  } catch { /* fall through */ }
  return null;
}

function getAuth() {
  if (cachedAuth) return cachedAuth;

  // ── Service Account (unlimited, no expiry) ───────────────────────
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
    return cachedAuth;
  }

  // ── OAuth (existing fallback) ──────────────────────────────────────
  const creds = loadCredentialsFromFile() || loadCredentialsFromEnv();
  if (!creds) {
    throw new Error(
      "Google credentials not found."
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

// ── Read ──
export async function readEventSheet(sheetName: string): Promise<string[][]> {
  const cacheKey = `event:${sheetName}`;
  const cached = getCachedRows(cacheKey);
  if (cached) return cached;

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  const rows = data.values || [];
  setCachedRows(cacheKey, rows);
  return cloneRows(rows);
}

// ── Write ──
export async function writeEventSheet(sheetName: string, values: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
  invalidateReadCache();
}

// ── Append ──
export async function appendEventRows(sheetName: string, rows: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
  invalidateReadCache();
}

// ── Create sheet if not exists ──
export async function ensureEventSheet(sheetName: string, headers: string[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Check if sheet exists
  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((s) => s.properties?.title === sheetName);
  if (exists) return;

  // Create sheet
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });

  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:Z1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
  invalidateReadCache();
}

// ── Initialize all event sheets ──
export async function initializeEventSheets(): Promise<void> {
  await ensureEventSheet(EVENT_SHEETS.Events, [
    "ID", "Name", "Slug", "Type", "Status", "Description", "PIC", "Instagram",
    "Start Date", "End Date", "Location", "Venue", "Budget", "Actual Cost", "Revenue",
    "Tenant Count", "Sponsor Count", "Attendee Target", "Attendee Actual", "Notes", "Created", "Updated"
  ]);

  await ensureEventSheet(EVENT_SHEETS.Budget, [
    "ID", "Event ID", "Category", "Item Name", "Planned Amount", "Actual Amount", "Notes", "Created"
  ]);

  await ensureEventSheet(EVENT_SHEETS.Tenants, [
    "ID", "Event ID", "Brand Name", "Contact Person", "Email", "Phone",
    "Booth Number", "Booth Size", "Package Type", "Fee", "Payment Status",
    "Payment Amount", "Contract Date", "Notes", "Created"
  ]);

  await ensureEventSheet(EVENT_SHEETS.Sponsors, [
    "ID", "Event ID", "Company Name", "Contact Person", "Email", "Phone",
    "Tier", "Sponsorship Amount", "In-Kind", "In-Kind Description", "In-Kind Value",
    "Payment Status", "Contract Date", "Logo URL", "Notes", "Created"
  ]);

  await ensureEventSheet(EVENT_SHEETS.Timeline, [
    "ID", "Event ID", "Phase", "Milestone", "Due Date", "Completed", "Completed Date", "Notes", "Created"
  ]);

  await ensureEventSheet(EVENT_SHEETS.Dashboard, [
    "Metric", "Value", "Notes"
  ]);

  await ensureEventSheet(EVENT_SHEETS.Media, [
    "ID", "Event ID", "Type", "Title", "URL", "Caption", "Source",
    "Featured", "Sort Order", "Created", "Updated"
  ]);
}
