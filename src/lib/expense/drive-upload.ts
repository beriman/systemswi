// Google Drive upload helper for Expense Proofs
// Uses the same Google OAuth credentials as Sheets
import { google } from "googleapis";
import fs from "fs";
import { Readable } from "stream";

const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

// Expense proofs folder path: 02_Data Perusahaan/05_Expense_Proofs/
const EXPENSE_PROOFS_FOLDER_NAME = "05_Expense_Proofs";
const DATA_PERUSAHAAN_FOLDER_NAME = "02_Data Perusahaan";

let cachedAuth: any = null;

function getDriveAuth() {
  if (cachedAuth) return cachedAuth;

  try {
    const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    const oauth2 = new google.auth.OAuth2(
      content.client_id,
      content.client_secret,
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:1"
    );
    oauth2.setCredentials({
      refresh_token: content.refresh_token,
      access_token: content.token || content.access_token || "",
      token_type: "Bearer",
      expiry_date: content.expiry_date || content.expiry || 0,
    });
    cachedAuth = oauth2;
    return cachedAuth;
  } catch {
    // Fallback to env vars
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;
    if (!client_id || !client_secret || !refresh_token) {
      throw new Error("Google credentials not found for Drive upload");
    }
    const oauth2 = new google.auth.OAuth2(
      client_id,
      client_secret,
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:1"
    );
    oauth2.setCredentials({
      refresh_token,
      access_token: process.env.GOOGLE_ACCESS_TOKEN || "",
      token_type: "Bearer",
      expiry_date: parseInt(process.env.GOOGLE_EXPIRY_DATE || "0", 10) || 0,
    });
    cachedAuth = oauth2;
    return cachedAuth;
  }
}

async function getDriveClient() {
  const auth = getDriveAuth();
  return google.drive({ version: "v3", auth });
}

async function findFolder(
  name: string,
  parentId?: string
): Promise<string | null> {
  const drive = await getDriveClient();
  let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 1,
  });
  return res.data.files?.[0]?.id || null;
}

async function createFolder(
  name: string,
  parentId?: string
): Promise<string> {
  const drive = await getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  return res.data.id!;
}

async function getExpenseProofsFolderId(): Promise<string> {
  const dataFolder = await findFolder(DATA_PERUSAHAAN_FOLDER_NAME);
  const parentFolder = dataFolder || undefined;

  const proofsFolder = await findFolder(
    EXPENSE_PROOFS_FOLDER_NAME,
    parentFolder
  );
  if (proofsFolder) return proofsFolder;

  return createFolder(EXPENSE_PROOFS_FOLDER_NAME, parentFolder);
}

export interface UploadProofResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

export async function uploadExpenseProof(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<UploadProofResult> {
  try {
    const folderId = await getExpenseProofsFolderId();
    const drive = await getDriveClient();

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Readable.from(buffer),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    return {
      success: true,
      fileId: res.data.id!,
      webViewLink: res.data.webViewLink || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
