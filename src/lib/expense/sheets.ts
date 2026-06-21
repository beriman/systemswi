// Expense Approval Flow — Google Sheets helper
// Uses the same Google OAuth token as the main SWI spreadsheet
import { google } from "googleapis";
import fs from "fs";

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

// ── Sheet names ──
export const EXPENSE_SHEETS = {
  Submissions: "Expense_Submissions",
  Approvers: "Expense_Approvers",
};

// ── Auth ──
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

// ── Read ──
export async function readExpenseSheet(sheetName: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return data.values || [];
}

// ── Write ──
export async function writeExpenseSheet(sheetName: string, values: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

// ── Append ──
export async function appendExpenseRows(sheetName: string, rows: (string | number)[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

// ── Update row ──
export async function updateExpenseRow(sheetName: string, rowNumber: number, values: (string | number)[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:Z${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

// ── Create sheet if not exists ──
export async function ensureExpenseSheet(sheetName: string, headers: string[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some((s) => s.properties?.title === sheetName);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:Z1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
}

// ── Initialize expense sheets ──
export async function initializeExpenseSheets(): Promise<void> {
  await ensureExpenseSheet(EXPENSE_SHEETS.Submissions, [
    "Submission ID", "Date", "Submitter Name", "Related Event",
    "Category", "Description", "Amount", "Proof URL",
    "Status", "Reviewed By", "Reviewed Date", "Notes",
  ]);

  await ensureExpenseSheet(EXPENSE_SHEETS.Approvers, [
    "Approver ID", "Name", "Role", "Email",
  ]);
}
