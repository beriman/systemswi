// GET /api/cashflow — Read cashflow forecast + actual from Google Sheets
// POST /api/cashflow — Create actual cashflow entry
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const money = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown) => String(value ?? "").trim();

function parseDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00.000Z`);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

export async function GET() {
  try {
    // Read forecast from Cashflow_Forecast sheet
    const forecastRows = await readRange("Cashflow_Forecast!A1:J50");
    const forecast = forecastRows.slice(1).filter(r => r.some(Boolean)).map(r => ({
      month: text(r[0]),
      label: text(r[1]) || text(r[0]),
      forecastInflow: money(r[2]),
      forecastOutflow: money(r[3]),
      forecastNet: money(r[4]),
      actualInflow: money(r[5]),
      actualOutflow: money(r[6]),
      actualNet: money(r[7]),
      variance: money(r[8]),
      status: text(r[9]) || "pending",
    }));

    // Read actual from Proyeksi_Cashflow_Store
    let storeForecast: any[] = [];
    try {
      const storeRows = await readRange("Proyeksi_Cashflow_Store!A1:Z50");
      storeForecast = storeRows.slice(1).filter(r => r.some(Boolean)).map(r => ({
        month: text(r[0]),
        label: text(r[1]) || text(r[0]),
        amount: money(r[2]),
        category: text(r[3]),
        notes: text(r[4]),
      }));
    } catch {
      // optional
    }

    // Summary
    const totalForecastInflow = forecast.reduce((s, f) => s + f.forecastInflow, 0);
    const totalForecastOutflow = forecast.reduce((s, f) => s + f.forecastOutflow, 0);
    const totalActualInflow = forecast.reduce((s, f) => s + f.actualInflow, 0);
    const totalActualOutflow = forecast.reduce((s, f) => s + f.actualOutflow, 0);

    return NextResponse.json({
      source: "Google Sheets: Cashflow_Forecast + Proyeksi_Cashflow_Store",
      sourceStatus: "live",
      forecast,
      storeForecast,
      summary: {
        totalForecastInflow,
        totalForecastOutflow,
        totalForecastNet: totalForecastInflow - totalForecastOutflow,
        totalActualInflow,
        totalActualOutflow,
        totalActualNet: totalActualInflow - totalActualOutflow,
        variance: (totalActualInflow - totalActualOutflow) - (totalForecastInflow - totalForecastOutflow),
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets cashflow", error),
        forecast: [],
        storeForecast: [],
        summary: null,
      });
    }
    return NextResponse.json({ error: "Gagal membaca cashflow", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action);

    if (action === "add-actual") {
      const date = text(body.date) || new Date().toISOString().slice(0, 10);
      const inflow = money(body.inflow);
      const outflow = money(body.outflow);
      const category = text(body.category) || "operational";
      const notes = text(body.notes);

      if (inflow <= 0 && outflow <= 0) {
        return NextResponse.json({ error: "inflow atau outflow wajib diisi" }, { status: 400 });
      }

      // Write to Cashflow_Aktual sheet
      const row = [`CF-${Date.now()}`, date, inflow, outflow, inflow - outflow, category, notes];
      await appendRows("Cashflow_Aktual", [row]);

      return NextResponse.json({
        success: true,
        action,
        entry: { date, inflow, outflow, net: inflow - outflow },
        syncedSheets: ["Cashflow_Aktual"],
      }, { status: 201 });
    }

    return NextResponse.json({ error: "action tidak valid. Pilih: add-actual" }, { status: 400 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        error: "Google Workspace OAuth perlu re-auth",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menyimpan cashflow", details: String(error) }, { status: 500 });
  }
}
