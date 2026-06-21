// POST /api/expenses/upload — Upload expense proof file to Google Drive
import { NextRequest, NextResponse } from "next/server";
import { uploadExpenseProof } from "@/lib/expense/drive-upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}. Allowed: JPG, PNG, PDF, XLSX` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadExpenseProof(
      file.name,
      file.type,
      buffer
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Upload failed", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      proofUrl: `https://drive.google.com/file/d/${result.fileId}/view`,
      webViewLink: result.webViewLink,
    });
  } catch (error) {
    console.error("POST /api/expenses/upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    );
  }
}
