// GET /api/budget/alerts — Categories >80% budget usage
import { NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function GET() {
  try {
    const rawRows = await readRange("Budget_vs_Actual!A1:R500");
    const alerts: Array<{
      id: string;
      category: string;
      month: string;
      budget: number;
      actual: number;
      percentUsed: number;
      level: "warning" | "danger" | "over";
      message: string;
    }> = [];

    if (rawRows.length <= 1) {
      return NextResponse.json({
        source: "Google Sheets: Budget_vs_Actual",
        sourceStatus: "live",
        generatedAt: new Date().toISOString(),
        alerts,
        total: 0,
      });
    }

    const headers = rawRows[0].map((h) => h.toLowerCase());
    const getVal = (row: string[], names: string[]): string => {
      for (const name of names) {
        const i = headers.indexOf(name);
        if (i >= 0 && i < row.length) return row[i];
      }
      return "";
    };

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row.some((cell) => String(cell).trim() !== "")) continue;

      const id = getVal(row, ["id"]) || `row-${i + 1}`;
      const category = getVal(row, ["category", "kategori"]) || "Uncategorized";
      const month = getVal(row, ["month", "period", "bulan"]) || "";
      const budget = money(getVal(row, ["budget", "budget amount", "planned", "anggaran"]));
      const actual = money(getVal(row, ["actual", "actual amount", "expense", "pengeluaran"]));

      if (budget <= 0) continue;

      const percentUsed = Math.round((actual / budget) * 100);

      if (actual > budget) {
        alerts.push({
          id, category, month, budget, actual, percentUsed,
          level: "over",
          message: `OVER BUDGET: ${category} ${month} melebihi anggaran sebesar Rp ${(actual - budget).toLocaleString("id-ID")}`,
        });
      } else if (percentUsed >= 95) {
        alerts.push({
          id, category, month, budget, actual, percentUsed,
          level: "danger",
          message: `KRITIS: ${category} ${month} sudah ${percentUsed}% terpakai`,
        });
      } else if (percentUsed >= 80) {
        alerts.push({
          id, category, month, budget, actual, percentUsed,
          level: "warning",
          message: `PERINGATAN: ${category} ${month} sudah ${percentUsed}% terpakai`,
        });
      }
    }

    // Sort by percent used descending
    alerts.sort((a, b) => b.percentUsed - a.percentUsed);

    return NextResponse.json({
      source: "Google Sheets: Budget_vs_Actual",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      alerts,
      total: alerts.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Budget_vs_Actual", error),
        alerts: [],
        total: 0,
      });
    }
    return NextResponse.json({ error: "Failed to fetch budget alerts", details: String(error) }, { status: 500 });
  }
}
