// POST /api/expenses/upload — Upload expense proof file to Google Drive
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { getAuth } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const EXPENSE_PROOFS_FOLDER_ID = process.env.SWI_EXPENSE_PROOFS_FOLDER_ID || "";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

function isAllowedMime(type: string) {
  return ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function safeName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
  return cleaned || "expense-proof";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file wajib diupload" }, { status: 400 });
    }
    if (file.size <= 0) {
      return NextResponse.json({ error: "file kosong" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "maksimal file 10MB" }, { status: 400 });
    }
    if (!isAllowedMime(file.type || "application/octet-stream")) {
      return NextResponse.json({ error: "format wajib PDF atau gambar" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = `expense-${timestamp.slice(0, 10)}-${safeName(file.name)}`;

    // Build parents array — only include if folder ID is configured
    const parents: string[] = [];
    if (EXPENSE_PROOFS_FOLDER_ID) {
      parents.push(EXPENSE_PROOFS_FOLDER_ID);
    }

    const requestBody: any = {
      name,
      description: `systemswi expense proof upload\nUploaded: ${timestamp}`,
    };
    if (parents.length > 0) {
      requestBody.parents = parents;
    }

    const created = await drive.files.create({
      requestBody,
      media: {
        mimeType: file.type || "application/octet-stream",
        body: Readable.from(buffer),
      },
      fields: "id,name,webViewLink,mimeType,size,createdTime",
      supportsAllDrives: true,
    });

    const uploaded = created.data;

    return NextResponse.json(
      {
        success: true,
        file: {
          id: uploaded.id,
          name: uploaded.name,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          createdTime: uploaded.createdTime,
          proofUrl: `https://drive.google.com/file/d/${uploaded.id}/view`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Upload bukti expense gagal", details: String(error) },
      { status: 500 }
    );
  }
}
