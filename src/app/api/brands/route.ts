// GET /api/brands — Brand production/sales/expense analytics
// POST /api/brands — Append brand, production, sale, or expense rows
import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRanges } from "@/lib/sheets/sheets-real";

const BRAND_RANGES = {
  master: "Brand_Master!A1:K200",
  production: "Brand_Production!A1:N1000",
  sales: "Brand_Sales!A1:N1000",
  expenses: "Brand_Expenses!A1:L1000",
  dashboard: "Brand_Dashboard!A1:C50",
};

type Brand = {
  id: string;
  name: string;
  category: string;
  status: string;
  pic: string;
  positioning: string;
  defaultChannel: string;
  notes: string;
  created: string;
  updated: string;
  templateVersion: string;
};

type BrandSummary = Brand & {
  productionQty: number;
  productionCost: number;
  unitsSold: number;
  grossRevenue: number;
  netRevenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  operatingProfit: number;
  avgSellingPrice: number;
  stockEstimate: number;
};

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `brand-${Date.now()}`;
}

function parseBrandRows(rows: string[][]): Brand[] {
  return rows.slice(1).filter((row) => s(row, 0) || s(row, 1)).map((row) => ({
    id: s(row, 0),
    name: s(row, 1),
    category: s(row, 2) || "Perfume",
    status: s(row, 3) || "Active",
    pic: s(row, 4),
    positioning: s(row, 5),
    defaultChannel: s(row, 6),
    notes: s(row, 7),
    created: s(row, 8),
    updated: s(row, 9),
    templateVersion: s(row, 10) || "v1",
  }));
}

function summarize(
  brands: Brand[],
  productionRows: string[][],
  salesRows: string[][],
  expenseRows: string[][]
): BrandSummary[] {
  return brands.map((brand) => {
    const prod = productionRows.slice(1).filter((row) => s(row, 2) === brand.id || s(row, 3) === brand.name);
    const sales = salesRows.slice(1).filter((row) => s(row, 2) === brand.id || s(row, 3) === brand.name);
    const expenses = expenseRows.slice(1).filter((row) => s(row, 2) === brand.id || s(row, 3) === brand.name);

    const productionQty = prod.reduce((sum, row) => sum + n(row[8]), 0);
    const productionCost = prod.reduce((sum, row) => sum + n(row[11]), 0);
    const unitsSold = sales.reduce((sum, row) => sum + n(row[7]), 0);
    const grossRevenue = sales.reduce((sum, row) => sum + n(row[9]), 0);
    const netRevenue = sales.reduce((sum, row) => sum + n(row[11]), 0);
    const cogs = sales.reduce((sum, row) => sum + n(row[12]), 0);
    const expenseTotal = expenses.reduce((sum, row) => sum + n(row[7]), 0);
    const grossProfit = netRevenue - cogs;
    const operatingProfit = grossProfit - expenseTotal;
    const avgSellingPrice = unitsSold ? netRevenue / unitsSold : 0;
    const stockEstimate = productionQty - unitsSold;

    return {
      ...brand,
      productionQty,
      productionCost,
      unitsSold,
      grossRevenue,
      netRevenue,
      cogs,
      expenses: expenseTotal,
      grossProfit,
      operatingProfit,
      avgSellingPrice,
      stockEstimate,
    };
  });
}

export async function GET() {
  try {
    const data = await readRanges(Object.values(BRAND_RANGES));
    const master = data[BRAND_RANGES.master] || [];
    const production = data[BRAND_RANGES.production] || [];
    const sales = data[BRAND_RANGES.sales] || [];
    const expenses = data[BRAND_RANGES.expenses] || [];
    const dashboard = data[BRAND_RANGES.dashboard] || [];
    const brands = parseBrandRows(master);
    const summaries = summarize(brands, production, sales, expenses);

    const totals = summaries.reduce(
      (acc, b) => ({
        brandCount: acc.brandCount + 1,
        productionQty: acc.productionQty + b.productionQty,
        productionCost: acc.productionCost + b.productionCost,
        unitsSold: acc.unitsSold + b.unitsSold,
        netRevenue: acc.netRevenue + b.netRevenue,
        cogs: acc.cogs + b.cogs,
        expenses: acc.expenses + b.expenses,
        grossProfit: acc.grossProfit + b.grossProfit,
        operatingProfit: acc.operatingProfit + b.operatingProfit,
      }),
      { brandCount: 0, productionQty: 0, productionCost: 0, unitsSold: 0, netRevenue: 0, cogs: 0, expenses: 0, grossProfit: 0, operatingProfit: 0 }
    );

    return NextResponse.json({
      brands: summaries,
      totals,
      raw: { master, production, sales, expenses, dashboard },
      workflow: [
        "1. Tambah brand di Brand_Master",
        "2. Catat batch produksi di Brand_Production",
        "3. Catat selling per channel di Brand_Sales",
        "4. Catat pengeluaran brand di Brand_Expenses",
        "5. Dashboard menghitung margin, profit, dan stock estimate per brand",
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load brand analytics", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "";
    const now = today();

    if (action === "add-brand") {
      const name = String(body.name || "").trim();
      if (!name) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
      const id = body.id || `brand-${slugify(name)}`;
      await appendRows("Brand_Master", [[
        id,
        name,
        body.category || "Perfume",
        body.status || "Active",
        body.pic || "Team Produksi",
        body.positioning || "",
        body.defaultChannel || "",
        body.notes || "",
        now,
        now,
        "v1",
      ]]);
      return NextResponse.json({ success: true, action, id });
    }

    if (action === "production") {
      const qty = n(body.qtyProduced);
      const hpp = n(body.hppPerUnit);
      const totalCost = body.totalProductionCost !== undefined ? n(body.totalProductionCost) : qty * hpp;
      const id = body.id || `prod-${Date.now()}`;
      await appendRows("Brand_Production", [[
        id,
        body.date || now,
        body.brandId || "",
        body.brandName || "",
        body.sku || "",
        body.productName || "",
        body.productType || "Perfume",
        body.batchCode || "",
        qty,
        body.unit || "pcs",
        hpp,
        totalCost,
        body.status || "Done",
        body.notes || "",
      ]]);
      return NextResponse.json({ success: true, action, id });
    }

    if (action === "sale") {
      const qty = n(body.qtySold);
      const price = n(body.unitPrice);
      const grossRevenue = body.grossRevenue !== undefined ? n(body.grossRevenue) : qty * price;
      const discount = n(body.discount);
      const netRevenue = body.netRevenue !== undefined ? n(body.netRevenue) : grossRevenue - discount;
      const id = body.id || `sale-${Date.now()}`;
      await appendRows("Brand_Sales", [[
        id,
        body.date || now,
        body.brandId || "",
        body.brandName || "",
        body.sku || "",
        body.productName || "",
        body.channel || "Direct",
        qty,
        price,
        grossRevenue,
        discount,
        netRevenue,
        n(body.cogs),
        body.notes || "",
      ]]);
      return NextResponse.json({ success: true, action, id });
    }

    if (action === "expense") {
      const id = body.id || `exp-${Date.now()}`;
      await appendRows("Brand_Expenses", [[
        id,
        body.date || now,
        body.brandId || "",
        body.brandName || "",
        body.category || "Marketing",
        body.expenseName || "",
        body.channelEvent || "",
        n(body.amount),
        body.paymentMethod || "",
        body.vendor || "",
        body.proofUrl || "",
        body.notes || "",
      ]]);
      return NextResponse.json({ success: true, action, id });
    }

    return NextResponse.json({ error: "Unknown action", available: ["add-brand", "production", "sale", "expense"] }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to append brand data", details: String(error) }, { status: 500 });
  }
}
