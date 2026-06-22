// POST /api/budget/seed — Seed budget vs actual data
import { NextRequest, NextResponse } from "next/server";
import { readRange, writeRange, appendRows, getAuth, SPREADSHEET_ID } from "@/lib/sheets/sheets-real";
import { google } from "googleapis";

export const runtime = "nodejs";

const MONTHS = [
  { name: "Jan 2026", short: "Jan", monthNum: 1 },
  { name: "Feb 2026", short: "Feb", monthNum: 2 },
  { name: "Mar 2026", short: "Mar", monthNum: 3 },
  { name: "Apr 2026", short: "Apr", monthNum: 4 },
  { name: "May 2026", short: "May", monthNum: 5 },
  { name: "Jun 2026", short: "Jun", monthNum: 6 },
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
  "Bahan Baku|Jun 2026": 0.97,
  "Iklan & Marketing|Apr 2026": 0.98,
};

function randBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

export async function POST(req: NextRequest) {
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

    // Clear sheet if forced — delete all rows then rewrite from scratch
    if (hasData && force) {
      try {
        const auth = getAuth();
        const sheets = google.sheets({ version: "v4", auth });

        // Get sheet ID
        const ss = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
          fields: "sheets.properties",
        });
        const sheetId = ss.data.sheets?.find(
          (s: any) => s.properties?.title === "Budget_vs_Actual"
        )?.properties?.sheetId;

        if (sheetId !== undefined) {
          // Delete all rows (row 1 onwards) to clear old data completely
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId,
                    dimension: "ROWS",
                    startIndex: 0, // row 1 (0-indexed)
                    endIndex: 1000, // delete up to row 1000
                  },
                },
              }],
            },
          });
        }
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

    // Write headers + data in a single writeRange call
    const headers = [
      "ID", "Category", "Month", "Year", "Budget", "Actual",
      "Remaining", "Event", "Notes", "Created", "Updated",
    ];

    const allRows: (string | number)[][] = [headers, ...rows];

    await writeRange("Budget_vs_Actual!A1:K31", allRows);

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
