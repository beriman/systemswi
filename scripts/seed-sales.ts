// Seed script for Sales Target vs Actual module
// Run: npx tsx scripts/seed-sales.ts

import { ensureSalesSheetsInitialized, createTarget, createActual } from "@/lib/sheets/sales-sheets";

const TARGETS = [
  // L'Arc~en~Scent: Rp 5-8jt/bulan
  { brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", year: 2026, month: 1, targetAmount: 5000000 },
  { brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", year: 2026, month: 2, targetAmount: 5500000 },
  { brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", year: 2026, month: 3, targetAmount: 6000000 },
  { brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", year: 2026, month: 4, targetAmount: 7000000 },
  { brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", year: 2026, month: 5, targetAmount: 7500000 },
  { brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", year: 2026, month: 6, targetAmount: 8000000 },
  // Pixel Potion: Rp 3-5jt/bulan
  { brandId: "brand-pixel-potion", brandName: "Pixel Potion", year: 2026, month: 1, targetAmount: 3000000 },
  { brandId: "brand-pixel-potion", brandName: "Pixel Potion", year: 2026, month: 2, targetAmount: 3200000 },
  { brandId: "brand-pixel-potion", brandName: "Pixel Potion", year: 2026, month: 3, targetAmount: 3500000 },
  { brandId: "brand-pixel-potion", brandName: "Pixel Potion", year: 2026, month: 4, targetAmount: 4000000 },
  { brandId: "brand-pixel-potion", brandName: "Pixel Potion", year: 2026, month: 5, targetAmount: 4500000 },
  { brandId: "brand-pixel-potion", brandName: "Pixel Potion", year: 2026, month: 6, targetAmount: 5000000 },
  // Nuscentza: Rp 4-6jt/bulan
  { brandId: "brand-nuscentza", brandName: "Nuscentza", year: 2026, month: 1, targetAmount: 4000000 },
  { brandId: "brand-nuscentza", brandName: "Nuscentza", year: 2026, month: 2, targetAmount: 4200000 },
  { brandId: "brand-nuscentza", brandName: "Nuscentza", year: 2026, month: 3, targetAmount: 4500000 },
  { brandId: "brand-nuscentza", brandName: "Nuscentza", year: 2026, month: 4, targetAmount: 5000000 },
  { brandId: "brand-nuscentza", brandName: "Nuscentza", year: 2026, month: 5, targetAmount: 5500000 },
  { brandId: "brand-nuscentza", brandName: "Nuscentza", year: 2026, month: 6, targetAmount: 6000000 },
];

const ACTUALS = [
  { date: "2026-01-05", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 15, unitPrice: 185000, channel: "Direct" },
  { date: "2026-01-18", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 50ml", qtySold: 8, unitPrice: 280000, channel: "Shopee" },
  { date: "2026-02-10", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 20, unitPrice: 185000, channel: "TikTok" },
  { date: "2026-02-22", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc Travel Set", qtySold: 5, unitPrice: 450000, channel: "Event" },
  { date: "2026-03-15", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 50ml", qtySold: 12, unitPrice: 280000, channel: "Tokopedia" },
  { date: "2026-04-08", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 25, unitPrice: 185000, channel: "Instagram" },
  { date: "2026-05-20", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc Gift Box", qtySold: 10, unitPrice: 550000, channel: "Direct" },
  { date: "2026-06-12", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 18, unitPrice: 185000, channel: "Shopee" },
  { date: "2026-01-12", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Mist 100ml", qtySold: 20, unitPrice: 95000, channel: "Shopee" },
  { date: "2026-02-05", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Mist 100ml", qtySold: 18, unitPrice: 95000, channel: "TikTok" },
  { date: "2026-03-20", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Roll-On 10ml", qtySold: 30, unitPrice: 65000, channel: "Tokopedia" },
  { date: "2026-04-15", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Mist 100ml", qtySold: 22, unitPrice: 95000, channel: "Direct" },
  { date: "2026-05-08", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Discovery Kit", qtySold: 8, unitPrice: 350000, channel: "Event" },
  { date: "2026-06-25", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Roll-On 10ml", qtySold: 25, unitPrice: 65000, channel: "Instagram" },
  { date: "2026-01-25", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza EDT 50ml", qtySold: 12, unitPrice: 150000, channel: "Direct" },
  { date: "2026-02-14", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza EDT 50ml", qtySold: 15, unitPrice: 150000, channel: "Shopee" },
  { date: "2026-03-10", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza Body Mist", qtySold: 20, unitPrice: 85000, channel: "TikTok" },
  { date: "2026-04-22", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza EDT 50ml", qtySold: 18, unitPrice: 150000, channel: "Tokopedia" },
  { date: "2026-05-15", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza Gift Set", qtySold: 6, unitPrice: 400000, channel: "Event" },
  { date: "2026-06-30", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza Body Mist", qtySold: 22, unitPrice: 85000, channel: "Instagram" },
];

async function main() {
  console.log("Initializing sheets...");
  await ensureSalesSheetsInitialized();

  let targetsCreated = 0;
  let actualsCreated = 0;
  const errors: string[] = [];

  console.log("Seeding targets...");
  for (const t of TARGETS) {
    try {
      await createTarget(t);
      targetsCreated++;
      console.log(`  ✓ Target: ${t.brandName} ${t.month}/${t.year}`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`Target ${t.brandName} ${t.month}/${t.year}: ${msg}`);
      console.log(`  ✗ Target: ${t.brandName} ${t.month}/${t.year}: ${msg}`);
    }
  }

  console.log("Seeding actuals...");
  for (const a of ACTUALS) {
    try {
      await createActual(a);
      actualsCreated++;
      console.log(`  ✓ Actual: ${a.brandName} ${a.date}`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`Actual ${a.brandName} ${a.date}: ${msg}`);
      console.log(`  ✗ Actual: ${a.brandName} ${a.date}: ${msg}`);
    }
  }

  console.log(`\nDone! ${targetsCreated} targets, ${actualsCreated} actuals created.`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main().catch(console.error);
