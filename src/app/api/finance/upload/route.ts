import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { getAuth } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export const runtime = "nodejs";

const FINANCE_FOLDER_ID = process.env.SWI_FINANCE_DRIVE_FOLDER_ID || "1Ko7Zoh7c3oo6ivdtiYPn3UtRLB90-AtK";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf", "text/csv"];
const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

function isAllowedMime(type: string) {
  return ALLOWED_MIME_EXACT.has(type) || ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function safeName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
  return cleaned || "finance-proof";
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Finance upload endpoint ready. Use POST with multipart form (file, referensi, deskripsi).",
    allowedTypes: ["image/*", "application/pdf", "text/csv"],
    maxSize: "10MB",
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const transactionRef = String(formData.get("referensi") || "").trim();
    const description = String(formData.get("deskripsi") || "").trim();

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
      return NextResponse.json({ error: "format wajib PDF, gambar, CSV, XLS, atau XLSX" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = `${timestamp.slice(0, 10)}-${transactionRef ? safeName(transactionRef) + "-" : ""}${safeName(file.name)}`;

    const created = await drive.files.create({
      requestBody: {
        name,
        parents: [FINANCE_FOLDER_ID],
        description: [
          "systemswi finance proof upload",
          transactionRef ? `Referensi: ${transactionRef}` : "Referensi: TBA",
          description ? `Deskripsi: ${description}` : "Deskripsi: TBA",
          `Uploaded: ${timestamp}`,
        ].join("\n"),
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: Readable.from(buffer),
      },
      fields: "id,name,webViewLink,mimeType,size,createdTime",
      supportsAllDrives: true,
    });

    const uploaded = created.data;
    const audit = await appendSwiMemoryLog({
      timestamp,
      action: "Finance proof upload",
      target: `Google Drive Finance/${uploaded.name || name}`,
      summary: `Uploaded proof file for ref ${transactionRef || "TBA"}; Drive file ${uploaded.id}; no Drive files deleted.`,
    }).catch((error) => ({ error: String(error) }));

    return NextResponse.json(
      {
        success: true,
        file: {
          id: uploaded.id,
          name: uploaded.name,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          createdTime: uploaded.createdTime,
          proofUrl: uploaded.webViewLink || (uploaded.id ? `https://drive.google.com/file/d/${uploaded.id}/view` : ""),
        },
        audit,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Upload bukti finance gagal", details: String(error) }, { status: 500 });
  }
}
