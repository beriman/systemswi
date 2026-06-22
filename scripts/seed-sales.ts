/**
 * Sales Target & Actual seed script
 * Run with: npx tsx scripts/seed-sales.ts
 */

import {
  ensureSalesSheetsInitialized,
  createTarget,
  createActual,
} from "../src/lib/sheets/sales-sheets";

const BRANDS = [
  { id: "brand-larc-en-scent", name: "L'Arc~en~Scent" },
  { id: "brand-pixel-potion", name: "Pixel Potion" },
  { id: "brand-nuscentza", name: "Nuscentza" },
];

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
  // L'Arc~en~Scent (8 transactions)
  { date: "2026-01-05", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 15, unitPrice: 185000, channel: "Direct" },
  { date: "2026-01-18", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 50ml", qtySold: 8, unitPrice: 280000, channel: "Shopee" },
  { date: "2026-02-10", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 20, unitPrice: 185000, channel: "TikTok" },
  { date: "2026-02-22", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc Travel Set", qtySold: 5, unitPrice: 450000, channel: "Event" },
  { date: "2026-03-15", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 50ml", qtySold: 12, unitPrice: 280000, channel: "Tokopedia" },
  { date: "2026-04-08", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 25, unitPrice: 185000, channel: "Instagram" },
  { date: "2026-05-20", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc Gift Box", qtySold: 10, unitPrice: 550000, channel: "Direct" },
  { date: "2026-06-12", brandId: "brand-larc-en-scent", brandName: "L'Arc~en~Scent", productSku: "L'Arc EDP 30ml", qtySold: 18, unitPrice: 185000, channel: "Shopee" },

  // Pixel Potion (6 transactions)
  { date: "2026-01-12", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Mist 100ml", qtySold: 20, unitPrice: 95000, channel: "Shopee" },
  { date: "2026-02-05", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Mist 100ml", qtySold: 18, unitPrice: 95000, channel: "TikTok" },
  { date: "2026-03-20", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Roll-On 10ml", qtySold: 30, unitPrice: 65000, channel: "Tokopedia" },
  { date: "2026-04-15", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Mist 100ml", qtySold: 22, unitPrice: 95000, channel: "Direct" },
  { date: "2026-05-08", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Discovery Kit", qtySold: 8, unitPrice: 350000, channel: "Event" },
  { date: "2026-06-25", brandId: "brand-pixel-potion", brandName: "Pixel Potion", productSku: "Pixel Roll-On 10ml", qtySold: 25, unitPrice: 65000, channel: "Instagram" },

  // Nuscentza (6 transactions)
  { date: "2026-01-25", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza EDT 50ml", qtySold: 12, unitPrice: 150000, channel: "Direct" },
  { date: "2026-02-14", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza EDT 50ml", qtySold: 15, unitPrice: 150000, channel: "Shopee" },
  { date: "2026-03-10", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza Body Mist", qtySold: 20, unitPrice: 85000, channel: "TikTok" },
  { date: "2026-04-22", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza EDT 50ml", qtySold: 18, unitPrice: 150000, channel: "Tokopedia" },
  { date: "2026-05-15", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza Gift Set", qtySold: 6, unitPrice: 400000, channel: "Event" },
  { date: "2026-06-30", brandId: "brand-nuscentza", brandName: "Nuscentza", productSku: "Nuscentza Body Mist", qtySold: 22, unitPrice: 85000, channel: "Instagram" },
];

async function main() {
  console.log("🌱 Seeding Sales Target & Actual data...\n");

  await ensureSalesSheetsInitialized();
  console.log("✅ Sheets initialized with headers\n");

  let targetsCreated = 0;
  let actualsCreated = 0;
  const errors: string[] = [];

  // Seed targets
  console.log("📊 Seeding targets...");
  for (const t of TARGETS) {
    try {
      await createTarget(t);
      targetsCreated++;
      console.log(`  ✅ ${t.brandName} ${t.month}/${t.year}: Rp ${t.targetAmount.toLocaleString("id-ID")}`);
    } catch (err) {
      const msg = `Target ${t.brandName} ${t.month}/${t.year}: ${String(err)}`;
      errors.push(msg);
      console.log(`  ❌ ${msg}`);
    }
  }

  // Seed actuals
  console.log("\n💰 Seeding actual sales...");
  for (const a of ACTUALS) {
    try {
      await createActual(a);
      actualsCreated++;
      const total = a.qtySold * a.unitPrice;
      console.log(`  ✅ ${a.brandName} ${a.date}: ${a.productSku} (${a.qtySold}×Rp ${a.unitPrice.toLocaleString("id-ID")} = Rp ${total.toLocaleString("id-ID")})`);
    } catch (err) {
      const msg = `Actual ${a.brandName} ${a.date}: ${String(err)}`;
      errors.push(msg);
      console.log(`  ❌ ${msg}`);
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`  Targets created: ${targetsCreated}/${TARGETS.length}`);
  console.log(`  Actuals created: ${actualsCreated}/${ACTUALS.length}`);
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`);
    errors.forEach((e) => console.log(`    - ${e}`));
  }
  console.log("\n✅ Done!");
}

main().catch(console.error);
