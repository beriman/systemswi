// GET /api/budget — List budget vs actual (filter: year, month, category)
// POST /api/budget — Create budget entry
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown): string => String(value ?? "").trim();

interface BudgetRow {
  id: string;
  category: string;
  month: string;
  year: string;
  budget: number;
  actual: number;
  remaining: number;
  percentUsed: number;
  variance: number;
  status: string;
  event?: string;
  notes?: string;
}

function parseBudgetRows(rows: string[][]): BudgetRow[] {
  if (rows.length <= 1) return [];
  const headers = rows[0].map((h) => h.toLowerCase());

  return rows.slice(1)
    .filter((row) => row.some((cell) => text(cell) !== ""))
    .map((row, idx) => {
      const get = (colNames: string[]): string => {
        for (const name of colNames) {
          const i = headers.indexOf(name);
          if (i >= 0 && i < row.length) return row[i];
        }
        return "";
      };

      const budget = money(get(["budget", "budget amount", "planned", "planned amount", "anggaran"]));
      const actual = money(get(["actual", "actual amount", "expense", "pengeluaran", "actual cost"]));
      const remaining = budget - actual;
      const percentUsed = budget > 0 ? Math.round((actual / budget) * 100) : 0;
      const variance = budget - actual;

      let status = "ok";
      if (actual > budget) status = "over";
      else if (actual / budget >= 0.95) status = "danger";
      else if (actual / budget >= 0.80) status = "warning";

      return {
        id: text(get(["id", "row id", ""])) || `row-${idx + 2}`,
        category: text(get(["category", "kategori", "category name"])) || "Uncategorized",
        month: text(get(["month", "period", "bulan"])) || "",
        year: text(get(["year", "tahun"])) || new Date().getFullYear().toString(),
        budget,
        actual,
        remaining,
        percentUsed,
        variance,
        status,
        event: text(get(["event", "event name"])) || undefined,
        notes: text(get(["notes", "catatan", "description"])) || undefined,
      };
    });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const category = searchParams.get("category") || "";

    const rawRows = await readRange("Budget_vs_Actual!A1:R500");
    let rows = parseBudgetRows(rawRows);

    // Apply filters
    if (year) rows = rows.filter((r) => r.year === year);
    if (month) rows = rows.filter((r) => r.month.toLowerCase().includes(month.toLowerCase()));
    if (category) rows = rows.filter((r) => r.category.toLowerCase().includes(category.toLowerCase()));

    return NextResponse.json({
      source: "Google Sheets: Budget_vs_Actual",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      filters: { year, month, category },
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Budget_vs_Actual", error),
        data: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch budget data", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date();
    const id = `bgt-${Date.now()}`;

    const row = [
      id,
      body.category || "Uncategorized",
      body.month || `${now.toLocaleString("en-US", { month: "short" })} ${now.getFullYear()}`,
      body.year || String(now.getFullYear()),
      Number(body.budget) || 0,
      Number(body.actual) || 0,
      Number(body.budget || 0) - Number(body.actual || 0),
      body.event || "",
      body.notes || "",
      now.toISOString().split("T")[0],
    ];

    await appendRows("BudgetVsActual", [row]);

    return NextResponse.json({ success: true, id, data: row }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: "Google Sheets: Budget_vs_Actual",
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menambah budget",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create budget entry", details: String(error) }, { status: 500 });
  }
}
