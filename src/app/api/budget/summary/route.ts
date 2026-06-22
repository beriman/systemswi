// GET /api/budget/summary — Summary: total budget, total actual, variance
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

    if (rawRows.length <= 1) {
      return NextResponse.json({
        source: "Google Sheets: Budget_vs_Actual",
        sourceStatus: "live",
        generatedAt: new Date().toISOString(),
        summary: {
          totalBudget: 0,
          totalActual: 0,
          totalRemaining: 0,
          overallPercent: 0,
          categoryCount: 0,
          overBudgetCount: 0,
          warningCount: 0,
        },
      });
    }

    const headers = rawRows[0].map((h) => h.toLowerCase());
    const getColIndex = (names: string[]): number => {
      for (const name of names) {
        const i = headers.indexOf(name);
        if (i >= 0) return i;
      }
      return -1;
    };

    const catIdx = getColIndex(["category", "kategori"]);
    const budgetIdx = getColIndex(["budget", "budget amount", "planned", "anggaran"]);
    const actualIdx = getColIndex(["actual", "actual amount", "expense", "pengeluaran"]);

    let totalBudget = 0;
    let totalActual = 0;
    let overBudgetCount = 0;
    let warningCount = 0;
    const categories = new Set<string>();

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row.some((cell) => String(cell).trim() !== "")) continue;

      const budget = budgetIdx >= 0 ? money(row[budgetIdx]) : 0;
      const actual = actualIdx >= 0 ? money(row[actualIdx]) : 0;
      const category = catIdx >= 0 ? String(row[catIdx] || "").trim() : "";

      totalBudget += budget;
      totalActual += actual;
      if (category) categories.add(category);

      if (actual > budget && budget > 0) overBudgetCount++;
      else if (actual / budget >= 0.80 && budget > 0) warningCount++;
    }

    const totalRemaining = totalBudget - totalActual;
    const overallPercent = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

    return NextResponse.json({
      source: "Google Sheets: Budget_vs_Actual",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: {
        totalBudget,
        totalActual,
        totalRemaining,
        overallPercent,
        categoryCount: categories.size,
        overBudgetCount,
        warningCount,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Budget_vs_Actual", error),
        summary: {
          totalBudget: 0,
          totalActual: 0,
          totalRemaining: 0,
          overallPercent: 0,
          categoryCount: 0,
          overBudgetCount: 0,
          warningCount: 0,
        },
      });
    }
    return NextResponse.json({ error: "Failed to fetch budget summary", details: String(error) }, { status: 500 });
  }
}
