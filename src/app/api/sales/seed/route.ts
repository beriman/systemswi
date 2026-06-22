// POST /api/sales/seed — Seed sample sales targets & actuals
import { NextRequest, NextResponse } from "next/server";
import { ensureSalesSheetsInitialized, getSalesTargets, getSalesActuals } from "@/lib/sheets/sales-sheets";
import { appendRows } from "@/lib/sheets/sheets-real";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST() {
  try {
    await ensureSalesSheetsInitialized();

    const existingTargets = await getSalesTargets(2026);
    const existingActuals = await getSalesActuals(2026);
    const alreadySeeded = existingTargets.length >= 18;

    if (alreadySeeded) {
      return NextResponse.json({
        message: "Seed data already exists",
        targetCount: existingTargets.length,
        actualCount: existingActuals.length,
      });
    }

    const now = today();

    // ── Targets: 3 brands × 6 months (Jan-Jun 2026) ──
    const targets = [
      // L'Arc~en~Scent — Rp 5-8jt/bulan
      ["ST-001", "brand-larc-en-scent", "L'Arc~en~Scent", 2026, 1, 5500000, 0, 0, "Target Januari", now, now],
      ["ST-002", "brand-larc-en-scent", "L'Arc~en~Scent", 2026, 2, 6000000, 0, 0, "Target Februari", now, now],
      ["ST-003", "brand-larc-en-scent", "L'Arc~en~Scent", 2026, 3, 7000000, 0, 0, "Target Maret", now, now],
      ["ST-004", "brand-larc-en-scent", "L'Arc~en~Scent", 2026, 4, 6500000, 0, 0, "Target April", now, now],
      ["ST-005", "brand-larc-en-scent", "L'Arc~en~Scent", 2026, 5, 7500000, 0, 0, "Target Mei", now, now],
      ["ST-006", "brand-larc-en-scent", "L'Arc~en~Scent", 2026, 6, 8000000, 0, 0, "Target Juni", now, now],
      // Pixel Potion — Rp 3-5jt/bulan
      ["ST-007", "brand-pixel-potion", "Pixel Potion", 2026, 1, 3200000, 0, 0, "Target Januari", now, now],
      ["ST-008", "brand-pixel-potion", "Pixel Potion", 2026, 2, 3500000, 0, 0, "Target Februari", now, now],
      ["ST-009", "brand-pixel-potion", "Pixel Potion", 2026, 3, 4000000, 0, 0, "Target Maret", now, now],
      ["ST-010", "brand-pixel-potion", "Pixel Potion", 2026, 4, 3800000, 0, 0, "Target April", now, now],
      ["ST-011", "brand-pixel-potion", "Pixel Potion", 2026, 5, 4500000, 0, 0, "Target Mei", now, now],
      ["ST-012", "brand-pixel-potion", "Pixel Potion", 2026, 6, 5000000, 0, 0, "Target Juni", now, now],
      // Nuscentza — Rp 4-6jt/bulan
      ["ST-013", "brand-nuscentza", "Nuscentza", 2026, 1, 4000000, 0, 0, "Target Januari", now, now],
      ["ST-014", "brand-nuscentza", "Nuscentza", 2026, 2, 4500000, 0, 0, "Target Februari", now, now],
      ["ST-015", "brand-nuscentza", "Nuscentza", 2026, 3, 5000000, 0, 0, "Target Maret", now, now],
      ["ST-016", "brand-nuscentza", "Nuscentza", 2026, 4, 4800000, 0, 0, "Target April", now, now],
      ["ST-017", "brand-nuscentza", "Nuscentza", 2026, 5, 5500000, 0, 0, "Target Mei", now, now],
      ["ST-018", "brand-nuscentza", "Nuscentza", 2026, 6, 6000000, 0, 0, "Target Juni", now, now],
    ];

    await appendRows("Sales_Targets", targets.map(t => t.map(v => typeof v === "number" ? v : String(v))));

    // ── Actuals: 20 sample sales transactions ──
    const actuals = [
      ["SA-001", "2026-01-05", "brand-larc-en-scent", "L'Arc~en~Scent", "EDP 30ml Classic", 12, 185000, 2220000, "Shopee", "Penjualan flash sale"],
      ["SA-002", "2026-01-12", "brand-larc-en-scent", "L'Arc~en~Scent", "Travel Set 3x15ml", 8, 320000, 2560000, "Direct", "Corporate order"],
      ["SA-003", "2026-01-18", "brand-pixel-potion", "Pixel Potion", "Body Mist Cyber Rose", 20, 95000, 1900000, "TikTok", "TikTok Shop promo"],
      ["SA-004", "2026-01-25", "brand-nuscentza", "Nuscentza", "Room Fogger Ocean", 15, 75000, 1125000, "Instagram", "Beli 2 gratis ongkir"],
      ["SA-005", "2026-02-03", "brand-larc-en-scent", "L'Arc~en~Scent", "EDP 50ml Noir", 6, 285000, 1710000, "Tokopedia", "Weekly promo"],
      ["SA-006", "2026-02-14", "brand-pixel-potion", "Pixel Potion", "Perfume Set Love Potion", 10, 250000, 2500000, "Event", "Valentine booth"],
      ["SA-007", "2026-02-20", "brand-nuscentza", "Nuscentza", "Car Freshener Set", 18, 55000, 990000, "Shopee", "Bundle deal"],
      ["SA-008", "2026-02-28", "brand-larc-en-scent", "L'Arc~en~Scent", "Gift Box Premium", 5, 550000, 2750000, "Direct", "Gift order"],
      ["SA-009", "2026-03-08", "brand-pixel-potion", "Pixel Potion", "Body Mist Neon Lemonade", 25, 90000, 2250000, "TikTok", "Influencer collab"],
      ["SA-010", "2026-03-15", "brand-nuscentza", "Nuscentza", "Scented Candle Vanilla", 30, 85000, 2550000, "Instagram", "Ramadan promo"],
      ["SA-011", "2026-03-22", "brand-larc-en-scent", "L'Arc~en~Scent", "EDP 30ml Classic", 15, 185000, 2775000, "Tokopedia", "Stok baru masuk"],
      ["SA-012", "2026-03-30", "brand-nuscentza", "Nuscentza", "Room Fogger Ocean", 22, 75000, 1650000, "Tokopedia", "Mid-month sale"],
      ["SA-013", "2026-04-05", "brand-larc-en-scent", "L'Arc~en~Scent", "Travel Set 3x15ml", 12, 320000, 3840000, "Direct", "Corporate gifting"],
      ["SA-014", "2026-04-15", "brand-pixel-potion", "Pixel Potion", "Body Mist Cyber Rose", 18, 95000, 1710000, "Shopee", "Regular sales"],
      ["SA-015", "2026-04-28", "brand-nuscentza", "Nuscentza", "Perfume Oil Arabian Nights", 10, 165000, 1650000, "Direct", "Premium segment"],
      ["SA-016", "2026-05-02", "brand-larc-en-scent", "L'Arc~en~Scent", "EDP 50ml Noir", 8, 285000, 2280000, "Instagram", "Mother's Day promo"],
      ["SA-017", "2026-05-10", "brand-pixel-potion", "Pixel Potion", "Perfume Set Love Potion", 15, 250000, 3750000, "Event", "Exhibition booth"],
      ["SA-018", "2026-05-20", "brand-nuscentza", "Nuscentza", "Scented Candle Set", 12, 120000, 1440000, "Shopee", "Flash sale"],
      ["SA-019", "2026-06-05", "brand-larc-en-scent", "L'Arc~en~Scent", "Gift Box Premium", 10, 550000, 5500000, "Direct", "Lebaran leftover order"],
      ["SA-020", "2026-06-18", "brand-pixel-potion", "Pixel Potion", "Body Mist Neon Lemonade", 22, 90000, 1980000, "TikTok", "Mid-year sale"],
    ];

    await appendRows("Sales_Actuals", actuals.map(a => a.map(v => typeof v === "number" ? v : String(v))));

    // ── Recalculate achievement and update targets ──
    // Aggregate actuals by brand/year/month
    const actualsAgg: Record<string, number> = {};
    for (const row of actuals) {
      const date = row[1] as string;
      const parts = date.split("-");
      const key = `${row[2]}_${parts[0]}_${parts[1]}`;
      actualsAgg[key] = (actualsAgg[key] || 0) + (row[7] as number);
    }

    // Target sheet columns: ID, BrandID, BrandName, Year, Month, Target, Actual, Ach%, Notes, Created, Updated
    // Update target rows with actual amounts and achievement
    // Read current target sheet
    const { readRange, writeRange } = await import("@/lib/sheets/sheets-real");
    const targetSheet = await readRange("Sales_Targets!A1:K100");
    if (targetSheet && targetSheet.length > 1) {
      for (let i = 1; i < targetSheet.length; i++) {
        const r = targetSheet[i];
        if (!r[0]) continue;
        const key = `${r[1]}_${r[3]}_${String(r[4]).padStart(2, "0")}`;
        // The actuals use month without pad, try both
        const key2 = `${r[1]}_${r[3]}_${r[4]}`;
        const actual = actualsAgg[key] || actualsAgg[key2] || 0;
        const target = Number(r[5]) || 0;
        const achievement = target > 0 ? Math.round((actual / target) * 10000) / 100 : 0;

        if (actual > 0) {
          // Update columns G (Actual Amount) and H (Achievement %)
          await writeRange(`Sales_Targets!G${i + 1}:H${i + 1}`, [[actual, achievement]]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seed data created",
      targetsSeeded: targets.length,
      actualsSeeded: actuals.length,
      brands: ["L'Arc~en~Scent", "Pixel Potion", "Nuscentza"],
      months: "Jan-Jun 2026",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed sales data", details: String(error) },
      { status: 500 }
    );
  }
}
