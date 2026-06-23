// GET /api/cash-harian — List entries (filter: startDate, endDate)
// POST /api/cash-harian — Create new entry
import { NextRequest, NextResponse } from "next/server";
import {
  getEntriesByDateRange,
  createEntry,
  ensureCashHarianInitialized,
} from "@/lib/sheets/cash-harian-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    await ensureCashHarianInitialized();
    const entries = await getEntriesByDateRange(startDate, endDate);

    return NextResponse.json({
      source: "Google Sheets: Cash_Harian",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      filters: { startDate: startDate || undefined, endDate: endDate || undefined },
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Cash_Harian", error),
        data: [],
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch cash harian entries", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const date = String(body.date || "").trim();
    const type = String(body.type || "Masuk").trim() as "Masuk" | "Keluar";
    const category = String(body.category || "").trim();
    const description = String(body.description || "").trim();
    const amount = Number(body.amount) || 0;
    const inputBy = String(body.inputBy || "").trim();

    if (!date) {
      return NextResponse.json(
        { error: "date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    if (type !== "Masuk" && type !== "Keluar") {
      return NextResponse.json(
        { error: "type must be 'Masuk' or 'Keluar'" },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      return NextResponse.json(
        { error: "amount must be greater than 0" },
        { status: 400 }
      );
    }

    await ensureCashHarianInitialized();
    const result = await createEntry({
      date,
      type,
      category,
      description,
      amount,
      inputBy,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          sourceStatus: "blocked",
          source: "Google Sheets: Cash_Harian",
          error: "Google Workspace OAuth perlu re-auth sebelum bisa menambah entry",
          details: String(error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create cash harian entry", details: String(error) },
      { status: 500 }
    );
  }
}
