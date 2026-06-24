// Verify Sukuk seed data was written correctly
import { readRange } from "../src/lib/sheets/sheets-real";

async function verify() {
  console.log("🔍 Verifying Sukuk seed data...\n");

  const checks = [
    { name: "Investors (SukukStore!A13:O17)", range: "SukukStore!A13:O17", expectedMin: 5 },
    { name: "Creditors (Sukuk_Creditor!A2:Z4)", range: "Sukuk_Creditor!A2:Z4", expectedMin: 3 },
    { name: "Products (SukukProduk!A7:J11)", range: "SukukProduk!A7:J11", expectedMin: 5 },
    { name: "RAB (Sukuk_RAB!A2:K4)", range: "Sukuk_RAB!A2:K4", expectedMin: 3 },
    { name: "Schedule (Sukuk_Payment_Schedule!A2:L7)", range: "Sukuk_Payment_Schedule!A2:L7", expectedMin: 6 },
    { name: "Audit (Sukuk_Audit!A2:H11)", range: "Sukuk_Audit!A2:H11", expectedMin: 10 },
    { name: "Notifications (Sukuk_Notification!A2:H6)", range: "Sukuk_Notification!A2:H6", expectedMin: 5 },
    { name: "Proyeksi (SukukStore!A30:O32)", range: "SukukStore!A30:O32", expectedMin: 3 },
    { name: "Store (SukukStore!A5:L7)", range: "SukukStore!A5:L7", expectedMin: 3 },
  ];

  let allOk = true;
  for (const check of checks) {
    try {
      const rows = await readRange(check.range);
      const count = rows.length;
      const ok = count >= check.expectedMin;
      console.log(`  ${ok ? "✅" : "❌"} ${check.name}: ${count} rows (expected ≥ ${check.expectedMin})`);
      if (!ok) allOk = false;
    } catch (err) {
      console.log(`  ❌ ${check.name}: ERROR - ${err}`);
      allOk = false;
    }
  }

  console.log(allOk ? "\n✅ All seed data verified!" : "\n❌ Some checks failed!");
  process.exit(allOk ? 0 : 1);
}

verify();
