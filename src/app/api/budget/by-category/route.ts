// GET /api/budget/by-category — Breakdown per category
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
        categories: [],
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
    const monthIdx = getColIndex(["month", "period", "bulan"]);

    const categoryMap = new Map<string, {
      category: string;
      totalBudget: number;
      totalActual: number;
      months: number;
    }>();

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row.some((cell) => String(cell).trim() !== "")) continue;

      const category = catIdx >= 0 ? String(row[catIdx] || "Uncategorized").trim() : "Uncategorized";
      const budget = budgetIdx >= 0 ? money(row[budgetIdx]) : 0;
      const actual = actualIdx >= 0 ? money(row[actualIdx]) : 0;
      const month = monthIdx >= 0 ? String(row[monthIdx] || "").trim() : "";

      const existing = categoryMap.get(category) || { category, totalBudget: 0, totalActual: 0, months: 0 };
      existing.totalBudget += budget;
      existing.totalActual += actual;
      if (month) existing.months += 1;
      categoryMap.set(category, existing);
    }

    const categories = Array.from(categoryMap.values())
      .map((cat) => ({
        ...cat,
        remaining: cat.totalBudget - cat.totalActual,
        percentUsed: cat.totalBudget > 0 ? Math.round((cat.totalActual / cat.totalBudget) * 100) : 0,
        status: cat.totalActual > cat.totalBudget ? "over" :
          cat.totalActual / cat.totalBudget >= 0.95 ? "danger" :
          cat.totalActual / cat.totalBudget >= 0.80 ? "warning" : "ok",
      }))
      .sort((a, b) => b.percentUsed - a.percentUsed);

    return NextResponse.json({
      source: "Google Sheets: Budget_vs_Actual",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      categories,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Budget_vs_Actual", error),
        categories: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch category breakdown", details: String(error) }, { status: 500 });
  }
}
