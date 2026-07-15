// Google Sheets integration for Event Management (Fragrantions)
// PIC: Wapiq Rizya Zaelan
// Uses the same auth stack as the main SWI spreadsheet helper so Vercel service-account
// fallback and OAuth refresh behavior stay consistent across finance + event modules.
import { google } from "googleapis";
import { getAuth, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";

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

// ── Auth is provided by src/lib/sheets/sheets-real.ts ──────────────
// Keep one credentials implementation for OAuth file/env + service-account fallback.

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
