// POST /api/bep/seed — Seed BEP calculations for 3 brands
import { NextRequest, NextResponse } from "next/server";
import { readRange, writeRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const text = (value: unknown): string => String(value ?? "").trim();

interface BrandSeed {
  brand: string;
  product: string;
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  currentSales: number;
}

const SEED_DATA: BrandSeed[] = [
  // Brand 1: Wangi Signature (Parfum Premium)
  {
    brand: "Wangi Signature",
    product: "Eau de Parfum 50ml",
    fixedCost: 45_000_000,
    variableCostPerUnit: 85_000,
    sellingPricePerUnit: 180_000,
    currentSales: 320,
  },
  {
    brand: "Wangi Signature",
    product: "Eau de Toilette 30ml",
    fixedCost: 30_000_000,
    variableCostPerUnit: 45_000,
    sellingPricePerUnit: 95_000,
    currentSales: 480,
  },
  {
    brand: "Wangi Signature",
    product: "Body Mist 100ml",
    fixedCost: 20_000_000,
    variableCostPerUnit: 22_000,
    sellingPricePerUnit: 55_000,
    currentSales: 650,
  },
  // Brand 2: Aroma Nusantara (Parfum Lokal)
  {
    brand: "Aroma Nusantara",
    product: "Eau de Parfum 30ml",
    fixedCost: 35_000_000,
    variableCostPerUnit: 55_000,
    sellingPricePerUnit: 120_000,
    currentSales: 380,
  },
  {
    brand: "Aroma Nusantara",
    product: "Roll-On 10ml",
    fixedCost: 15_000_000,
    variableCostPerUnit: 12_000,
    sellingPricePerUnit: 35_000,
    currentSales: 720,
  },
  {
    brand: "Aroma Nusantara",
    product: "Hair Mist 50ml",
    fixedCost: 18_000_000,
    variableCostPerUnit: 18_000,
    sellingPricePerUnit: 45_000,
    currentSales: 550,
  },
  // Brand 3: Scent of SWI (Merchandise + Parfum)
  {
    brand: "Scent of SWI",
    product: "Mini Discovery Set",
    fixedCost: 25_000_000,
    variableCostPerUnit: 35_000,
    sellingPricePerUnit: 80_000,
    currentSales: 420,
  },
  {
    brand: "Scent of SWI",
    product: "Travel Size 15ml",
    fixedCost: 12_000_000,
    variableCostPerUnit: 20_000,
    sellingPricePerUnit: 48_000,
    currentSales: 380,
  },
  {
    brand: "Scent of SWI",
    product: "Gift Box Set",
    fixedCost: 40_000_000,
    variableCostPerUnit: 120_000,
    sellingPricePerUnit: 280_000,
    currentSales: 180,
  },
];

function calcBEP(fixedCost: number, variableCost: number, sellingPrice: number) {
  const contributionMargin = sellingPrice - variableCost;
  if (contributionMargin <= 0) {
    return { contributionMargin: 0, bepUnits: 0, bepRevenue: 0 };
  }
  const bepUnits = Math.ceil(fixedCost / contributionMargin);
  const bepRevenue = bepUnits * sellingPrice;
  return { contributionMargin, bepUnits, bepRevenue };
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    // Check if data already exists
    const existing = await readRange("BEP_Calculations!A1:L1000");
    const hasData = existing.length > 1 && existing.slice(1).some((r) => r.some((c) => text(c) !== ""));

    if (hasData && !force) {
      return NextResponse.json({
        success: false,
        message: "BEP_Calculations sheet already has data. Use ?force=true to overwrite.",
        existingRows: existing.length - 1,
      });
    }

    // Clear sheet if forced
    if (hasData && force) {
      try {
        const emptyRows = Array.from({ length: 1000 }, () => Array(12).fill(" "));
        await writeRange("BEP_Calculations!A1:L1000", emptyRows);
        const { getAuth } = await import("@/lib/sheets/sheets-real");
        const { google } = await import("googleapis");
        const auth = getAuth();
        const sheets = google.sheets({ version: "v4", auth });
        await sheets.spreadsheets.values.clear({
          spreadsheetId: "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
          range: "BEP_Calculations!A1:L1000",
        });
      } catch (clearErr) {
        console.error("Clear failed, proceeding with overwrite:", clearErr);
      }
    }

    // Generate seed rows
    const rows: (string | number)[][] = [];
    let idCounter = 1;

    for (const item of SEED_DATA) {
      const { contributionMargin, bepUnits, bepRevenue } = calcBEP(
        item.fixedCost,
        item.variableCostPerUnit,
        item.sellingPricePerUnit
      );
      const marginOfSafety = item.currentSales > 0
        ? Math.round(((item.currentSales - bepUnits) / item.currentSales) * 100)
        : 0;
      const profitLoss = (item.currentSales * contributionMargin) - item.fixedCost;

      const id = `bep-${String(idCounter).padStart(4, "0")}`;
      rows.push([
        id,
        item.brand,
        item.product,
        item.fixedCost,
        item.variableCostPerUnit,
        item.sellingPricePerUnit,
        contributionMargin,
        bepUnits,
        bepRevenue,
        item.currentSales,
        marginOfSafety,
        profitLoss,
      ]);
      idCounter++;
    }

    // Write headers + data
    const headers = [
      "ID", "Brand", "Product", "Fixed Cost", "Variable Cost/Unit",
      "Selling Price/Unit", "Contribution Margin", "BEP (units)",
      "BEP (revenue)", "Current Sales", "Margin of Safety", "Profit/Loss",
    ];

    const allRows: (string | number)[][] = [headers, ...rows];

    // Pad to 1000 rows
    const paddedRows = allRows.map((row) => {
      const padded = [...row];
      while (padded.length < 12) padded.push("");
      return padded;
    });
    while (paddedRows.length < 1000) {
      paddedRows.push(Array(12).fill(""));
    }

    await writeRange("BEP_Calculations!A1:L1000", paddedRows);

    return NextResponse.json({
      success: true,
      message: `Seeded ${rows.length} BEP calculations (${SEED_DATA.length} products across 3 brands)`,
      rowsCreated: rows.length,
      brands: [...new Set(SEED_DATA.map((d) => d.brand))],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to seed BEP data", details: String(error) },
      { status: 500 }
    );
  }
}
