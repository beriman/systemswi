// PUT /api/budget/[id] — Update budget amount
import { NextRequest, NextResponse } from "next/server";
import { readRange, writeRange } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Read all rows to find the matching ID
    const rawRows = await readRange("Budget_vs_Actual!A1:R500");
    const headers = rawRows[0] || [];
    let found = false;
    let updatedRow: (string | number)[] = [];

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row[0] === id) {
        // Update fields
        const budget = body.budget !== undefined ? Number(body.budget) : money(row[4]);
        const actual = body.actual !== undefined ? Number(body.actual) : money(row[5]);
        const remaining = budget - actual;

        updatedRow = [
          row[0], // id
          body.category || row[1],
          body.month || row[2],
          body.year || row[3],
          budget,
          actual,
          remaining,
          body.event || row[7] || "",
          body.notes || row[8] || "",
          row[9] || "", // created
          new Date().toISOString().split("T")[0], // updated
        ];

        // Write back to sheet (row i+1 because 1-indexed, +1 for header)
        await writeRange(`Budget_vs_Actual!A${i + 1}:R${i + 1}`, [updatedRow]);
        found = true;
        break;
      }
    }

    if (!found) {
      return NextResponse.json({ error: "Budget entry not found", id }, { status: 404 });
    }

    return NextResponse.json({ success: true, id, data: updatedRow });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Budget_vs_Actual", error),
        error: "Google Workspace OAuth perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update budget entry", details: String(error) }, { status: 500 });
  }
}
