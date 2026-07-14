import { NextRequest, NextResponse } from "next/server";
import {
  readRange,
  writeRange,
  ensureSalesSheetsInitialized,
  getSalesTargets,
  getSalesActuals,
  createTarget,
  createActual,
} from "@/lib/sheets/sales-sheets";

// ── Seed data definitions ──────────────────────────────────────────

// Targets: 3 brands × 6 months (Jan-Jun 2026)
const TARGET_DATA: { brandId: string; brandName: string; month: number; targetAmount: number }[] = [];

// L'Arc~en~Scent: Rp 5-8jt/bulan
const larcTargets = [5_000_000, 6_000_000, 7_500_000, 5_500_000, 8_000_000, 6_500_000];
larcTargets.forEach((amount, i) => {
  TARGET_DATA.push({ brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", month: i + 1, targetAmount: amount });
});

// Pixel Potion: Rp 3-5jt/bulan
const pixelTargets = [3_000_000, 4_500_000, 3_500_000, 5_000_000, 4_000_000, 3_200_000];
pixelTargets.forEach((amount, i) => {
  TARGET_DATA.push({ brandId: "brand-pixel-potion", brandName: "Pixel Potion", month: i + 1, targetAmount: amount });
});

// Nuscentza: Rp 4-6jt/bulan
const nuscentzaTargets = [4_000_000, 5_500_000, 4_500_000, 6_000_000, 5_000_000, 4_800_000];
nuscentzaTargets.forEach((amount, i) => {
  TARGET_DATA.push({ brandId: "brand-nuscentza", brandName: "Nuscentza", month: i + 1, targetAmount: amount });
});

// 20 sample actual sales transactions
const ACTUAL_DATA: {
  date: string; brandId: string; brandName: string; productSku: string;
  qtySold: number; unitPrice: number; channel: string; notes: string;
}[] = [
  // L'Arc~en~Scent
  { date: "2026-01-05", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDP-001", qtySold: 15, unitPrice: 350_000, channel: "Shopee", notes: "Promo awal tahun" },
  { date: "2026-01-18", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDP-002", qtySold: 8, unitPrice: 450_000, channel: "Direct", notes: "Corporate gift" },
  { date: "2026-02-10", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDP-001", qtySold: 12, unitPrice: 350_000, channel: "Tokopedia", notes: "" },
  { date: "2026-02-25", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDT-003", qtySold: 10, unitPrice: 280_000, channel: "TikTok", notes: "Flash sale" },
  { date: "2026-03-08", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDP-001", qtySold: 20, unitPrice: 350_000, channel: "Shopee", notes: "Harbolnas" },
  { date: "2026-04-12", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDP-002", qtySold: 14, unitPrice: 450_000, channel: "Event", notes: "Pop-up store" },
  { date: "2026-05-20", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDT-003", qtySold: 18, unitPrice: 280_000, channel: "Instagram", notes: "" },
  { date: "2026-06-05", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "LARC-EDP-001", qtySold: 11, unitPrice: 350_000, channel: "Direct", notes: "" },
  // Pixel Potion
  { date: "2026-01-12", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "PXP-BODY-001", qtySold: 20, unitPrice: 180_000, channel: "Shopee", notes: "" },
  { date: "2026-01-28", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "PXP-PERF-002", qtySold: 10, unitPrice: 250_000, channel: "Tokopedia", notes: "" },
  { date: "2026-02-14", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "PXP-BODY-001", qtySold: 18, unitPrice: 180_000, channel: "TikTok", notes: "Valentine promo" },
  { date: "2026-03-22", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "PXP-PERF-002", qtySold: 15, unitPrice: 250_000, channel: "Direct", notes: "" },
  { date: "2026-04-08", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "PXP-BODY-001", qtySold: 25, unitPrice: 180_000, channel: "Shopee", notes: "Sale 12.12" },
  { date: "2026-05-15", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "PXP-PERF-002", qtySold: 12, unitPrice: 250_000, channel: "Instagram", notes: "" },
  { date: "2026-06-10", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "PXP-BODY-001", qtySold: 22, unitPrice: 180_000, channel: "Lazada", notes: "" },
  // Nuscentza
  { date: "2026-01-20", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "NUS-EDP-001", qtySold: 12, unitPrice: 320_000, channel: "Shopee", notes: "" },
  { date: "2026-02-28", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "NUS-EDP-001", qtySold: 16, unitPrice: 320_000, channel: "Tokopedia", notes: "" },
  { date: "2026-03-15", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "NUS-EDT-002", qtySold: 10, unitPrice: 250_000, channel: "Direct", notes: "Reseller order" },
  { date: "2026-04-25", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "NUS-EDP-001", qtySold: 20, unitPrice: 320_000, channel: "Event", notes: "Exhibition" },
  { date: "2026-05-30", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "NUS-EDT-002", qtySold: 14, unitPrice: 250_000, channel: "Instagram", notes: "" },
];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await ensureSalesSheetsInitialized();

    // Check for force=true query param — clears existing data before seeding
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    if (force) {
      // Clear all data rows (keep headers)
      const targetRows = await readRange("Sales_Targets!A2:K1000");
      if (targetRows.length > 0) {
        await writeRange(
          `Sales_Targets!A2:K${targetRows.length + 1}`,
          Array(targetRows.length).fill(Array(11).fill(""))
        );
      }
      const actualRows = await readRange("Sales_Actuals!A2:J1000");
      if (actualRows.length > 0) {
        await writeRange(
          `Sales_Actuals!A2:J${actualRows.length + 1}`,
          Array(actualRows.length).fill(Array(10).fill(""))
        );
      }
    }

    // Check if data already exists
    const existingTargets = await getSalesTargets(2026);
    const existingActuals = await getSalesActuals(2026);

    let targetsCreated = 0;
    let actualsCreated = 0;

    // Seed targets if none exist for 2026 (or forced)
    if (existingTargets.length === 0 || force) {
      for (const t of TARGET_DATA) {
        await createTarget({
          brandId: t.brandId,
          brandName: t.brandName,
          year: 2026,
          month: t.month,
          targetAmount: t.targetAmount,
          notes: `Target ${t.brandName} 2026`,
        });
        targetsCreated++;
      }
    }

    // Seed actuals if none exist for 2026 (or forced)
    if (existingActuals.length === 0 || force) {
      for (const a of ACTUAL_DATA) {
        await createActual({
          date: a.date,
          brandId: a.brandId,
          brandName: a.brandName,
          productSku: a.productSku,
          qtySold: a.qtySold,
          unitPrice: a.unitPrice,
          channel: a.channel,
          notes: a.notes,
        });
        actualsCreated++;
      }
    }

    return NextResponse.json({
      message: `Seed selesai: ${targetsCreated} targets, ${actualsCreated} actuals.${force ? " (force: data lama dihapus)" : ""} ${!force && existingTargets.length > 0 ? " (Targets sudah ada, diskip)" : ""} ${!force && existingActuals.length > 0 ? " (Actuals sudah ada, diskip)" : ""}`,
      targetsCreated,
      actualsCreated,
      force,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed data";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
