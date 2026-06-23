// PUT /api/cash-harian/[id] — Update an entry
import { NextRequest, NextResponse } from "next/server";
import { updateEntry, ensureCashHarianInitialized } from "@/lib/sheets/cash-harian-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const type = body.type
      ? String(body.type).trim() as "Masuk" | "Keluar"
      : undefined;

    if (type && type !== "Masuk" && type !== "Keluar") {
      return NextResponse.json(
        { error: "type must be 'Masuk' or 'Keluar'" },
        { status: 400 }
      );
    }

    if (body.amount !== undefined && Number(body.amount) <= 0) {
      return NextResponse.json(
        { error: "amount must be greater than 0" },
        { status: 400 }
      );
    }

    await ensureCashHarianInitialized();
    const result = await updateEntry(id, {
      date: body.date ? String(body.date).trim() : undefined,
      type,
      category: body.category !== undefined ? String(body.category).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      inputBy: body.inputBy !== undefined ? String(body.inputBy).trim() : undefined,
    });

    if (!result) {
      return NextResponse.json(
        { error: `Entry with id '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          ...googleWorkspaceWriteBlockedSource("Google Sheets: Cash_Harian", error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update cash harian entry", details: String(error) },
      { status: 500 }
    );
  }
}
