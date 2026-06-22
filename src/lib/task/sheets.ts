// Google Sheets integration for Task Management
// Uses the same Google OAuth token as the main SWI spreadsheet
import { getAuth, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";

// ── Sheet names ──
export const TASK_SHEETS = {
  Tasks: "Tasks",
  TaskComments: "Task_Comments",
};

// ── Column indices (0-based) for Tasks sheet ──
// Task ID, Title, Description, Assignee, PIC Name, Due Date, Priority, Status,
// Related Event/Project, Created By, Created Date, Completed Date, Notes
export const TASK_COLS = {
  id: 0,
  title: 1,
  description: 2,
  assignee: 3,
  picName: 4,
  dueDate: 5,
  priority: 6,
  status: 7,
  relatedEvent: 8,
  createdBy: 9,
  createdDate: 10,
  completedDate: 11,
  notes: 12,
} as const;

// ── Column indices for Task_Comments sheet ──
// Comment ID, Task ID, Author, Date, Comment
export const COMMENT_COLS = {
  id: 0,
  taskId: 1,
  author: 2,
  date: 3,
  comment: 4,
} as const;

// ── Read ──
export async function readTaskSheet(sheetName: string): Promise<string[][]> {
  const auth = getAuth();
  const { google } = await import("googleapis");
  const sheets = google.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:M`,
  });
  return data.values || [];
}

// ── Write (overwrite range) ──
export async function writeTaskSheet(
  sheetName: string,
  values: (string | number)[][]
): Promise<void> {
  const auth = getAuth();
  const { google } = await import("googleapis");
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:M`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

// ── Append rows ──
export async function appendTaskRows(
  sheetName: string,
  rows: (string | number)[][]
): Promise<void> {
  const auth = getAuth();
  const { google } = await import("googleapis");
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:M`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

// ── Update a single row ──
export async function updateTaskRow(
  sheetName: string,
  rowNumber: number,
  values: (string | number)[]
): Promise<void> {
  const auth = getAuth();
  const { google } = await import("googleapis");
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:M${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

// ── Find row number by ID (1-based, including header) ──
export async function findTaskRowById(taskId: string): Promise<number> {
  const rows = await readTaskSheet(TASK_SHEETS.Tasks);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][TASK_COLS.id] === taskId) {
      return i + 1; // 1-based row number in sheet
    }
  }
  return -1;
}

// ── Ensure sheet exists with headers ──
export async function ensureTaskSheet(
  sheetName: string,
  headers: string[]
): Promise<void> {
  const auth = getAuth();
  const { google } = await import("googleapis");
  const sheets = google.sheets({ version: "v4", auth });

  const ss = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const exists = ss.data.sheets?.some(
    (s) => s.properties?.title === sheetName
  );
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:M1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
}

// ── Initialize both task sheets ──
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

// ── Parse task row to object ──
export function parseTaskRow(row: string[]) {
  return {
    id: row[TASK_COLS.id] || "",
    title: row[TASK_COLS.title] || "",
    description: row[TASK_COLS.description] || "",
    assignee: row[TASK_COLS.assignee] || "",
    picName: row[TASK_COLS.picName] || "",
    dueDate: row[TASK_COLS.dueDate] || "",
    priority: row[TASK_COLS.priority] || "Medium",
    status: row[TASK_COLS.status] || "To Do",
    relatedEvent: row[TASK_COLS.relatedEvent] || "",
    createdBy: row[TASK_COLS.createdBy] || "",
    createdDate: row[TASK_COLS.createdDate] || "",
    completedDate: row[TASK_COLS.completedDate] || "",
    notes: row[TASK_COLS.notes] || "",
  };
}

// ── Parse comment row to object ──
export function parseCommentRow(row: string[]) {
  return {
    id: row[COMMENT_COLS.id] || "",
    taskId: row[COMMENT_COLS.taskId] || "",
    author: row[COMMENT_COLS.author] || "",
    date: row[COMMENT_COLS.date] || "",
    comment: row[COMMENT_COLS.comment] || "",
  };
}
