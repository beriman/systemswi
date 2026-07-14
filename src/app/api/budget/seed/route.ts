// POST /api/budget/seed — Seed budget vs actual data
import { NextRequest, NextResponse } from "next/server";
import { readRange, writeRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

// Use "Jan-26" format (with dash) to prevent Google Sheets from auto-converting to dates
const MONTHS = [
  { name: "Jan-26", short: "Jan", monthNum: 1 },
  { name: "Feb-26", short: "Feb", monthNum: 2 },
  { name: "Mar-26", short: "Mar", monthNum: 3 },
  { name: "Apr-26", short: "Apr", monthNum: 4 },
  { name: "May-26", short: "May", monthNum: 5 },
  { name: "Jun-26", short: "Jun", monthNum: 6 },
];

interface CategoryConfig {
  name: string;
  minBudget: number;
  maxBudget: number;
  actualMinPct: number;
  actualMaxPct: number;
}

const CATEGORIES: CategoryConfig[] = [
  { name: "Bahan Baku", minBudget: 10_000_000, maxBudget: 15_000_000, actualMinPct: 0.60, actualMaxPct: 0.92 },
  { name: "Iklan & Marketing", minBudget: 3_000_000, maxBudget: 5_000_000, actualMinPct: 0.70, actualMaxPct: 0.88 },
  { name: "Sewa Booth", minBudget: 2_000_000, maxBudget: 8_000_000, actualMinPct: 0.50, actualMaxPct: 0.75 },
  { name: "Packaging", minBudget: 2_000_000, maxBudget: 4_000_000, actualMinPct: 0.55, actualMaxPct: 0.78 },
  { name: "Transport", minBudget: 500_000, maxBudget: 1_500_000, actualMinPct: 0.60, actualMaxPct: 0.85 },
];

const DEMO_ALERTS: Record<string, number> = {
  "Bahan Baku|Jun-26": 0.97,
  "Iklan & Marketing|Apr-26": 0.98,
};

function randBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    // Check if data already exists
    const existing = await readRange("Budget_vs_Actual!A1:R500");
    const hasData = existing.length > 1 && existing.slice(1).some((r) => r.some((c) => String(c).trim() !== ""));

    if (hasData && !force) {
      return NextResponse.json({
        success: false,
        message: "Budget_vs_Actual sheet already has data. Skipping seed.",
        existingRows: existing.length - 1,
      });
    }

    // Clear sheet if forced — overwrite the full API read range to remove stale data
    if (hasData && force) {
      try {
        // Clear A1:R500 (must match the API read range so no stale rows remain)
        // Use " " (single space) instead of empty string to force Google Sheets to clear cells
        const emptyRows = Array.from({ length: 500 }, () => Array(18).fill(" "));
        await writeRange("Budget_vs_Actual!A1:R500", emptyRows);
        // Also clear via raw API to ensure cells are truly cleared
        const { getAuth } = await import("@/lib/sheets/sheets-real");
        const { google } = await import("googleapis");
        const auth = getAuth();
        const sheets = google.sheets({ version: "v4", auth });
        await sheets.spreadsheets.values.clear({
          spreadsheetId: "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
          range: "Budget_vs_Actual!A1:R500",
        });
      } catch (clearErr) {
        console.error("Clear failed, proceeding with overwrite:", clearErr);
      }
    }

    // Generate seed rows
    const rows: (string | number)[][] = [];
    let idCounter = 1;

    for (const cat of CATEGORIES) {
      for (const month of MONTHS) {
        const key = `${cat.name}|${month.name}`;
        const budget = randBetween(cat.minBudget, cat.maxBudget);

        let actualPct: number;
        if (DEMO_ALERTS[key] !== undefined) {
          actualPct = DEMO_ALERTS[key];
        } else {
          actualPct = cat.actualMinPct + Math.random() * (cat.actualMaxPct - cat.actualMinPct);
        }
        const actual = Math.round(budget * actualPct / 1000) * 1000;
        const remaining = budget - actual;

        const id = `bgt-${String(idCounter).padStart(4, "0")}`;
        rows.push([
          id,
          cat.name,
          month.name,
          "2026",
          budget,
          actual,
          remaining,
          "",
          `Seed data ${cat.name} ${month.name}`,
          new Date().toISOString().split("T")[0],
          "",
        ]);
        idCounter++;
      }
    }

    // Write headers + data in a single writeRange call (full range A1:R500 to match API reads)
    const headers = [
      "ID", "Category", "Month", "Year", "Budget", "Actual",
      "Remaining", "Event", "Notes", "Created", "Updated",
    ];

    const allRows: (string | number)[][] = [headers, ...rows];

    // Pad each row to 18 columns (A-R) so the full range is cleanly overwritten
    const paddedRows = allRows.map((row) => {
      const padded = [...row];
      while (padded.length < 18) padded.push("");
      return padded;
    });

    // Pad to 500 rows to fully overwrite the API read range
    while (paddedRows.length < 500) {
      paddedRows.push(Array(18).fill(""));
    }

    await writeRange("Budget_vs_Actual!A1:R500", paddedRows);

    return NextResponse.json({
      success: true,
      message: `Seeded ${rows.length} budget entries (${CATEGORIES.length} categories × ${MONTHS.length} months)`,
      rowsCreated: rows.length,
      categories: CATEGORIES.map((c) => c.name),
      months: MONTHS.map((m) => m.name),
      demoAlerts: Object.keys(DEMO_ALERTS),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to seed budget data", details: String(error) },
      { status: 500 }
    );
  }
}
