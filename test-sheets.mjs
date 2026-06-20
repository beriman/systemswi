import { readRange } from './src/lib/sheets/sheets-real.ts';

async function test() {
  const tests = [
    ['Supplier_Master', 'Supplier_Master!A1:J10'],
    ['Purchase_Orders', 'Purchase_Orders!A1:N10'],
    ['Goods_Receipts', 'Goods_Receipts!A1:M10'],
    ['Events', 'Events!A1:Z10'],
    ['SukukProduk', 'SukukProduk!A6:J20'],
    ['Ecommerse', 'Ecommerse!A1:Z5'],
    ['Merch_TIM', 'Merch_TIM!A1:L15'],
    ['Store_Daily', 'Store_Daily!A1:J10'],
    ['Laporan_Harian', 'Laporan_Harian!A1:Z10'],
    ['Laporan_Bulanan', 'Laporan_Bulanan!A1:P20'],
    ['Cashflow_Forecast', 'Cashflow_Forecast!A1:J10'],
    ['SukukMikro_Investments', 'SukukMikro_Investments!A1:J10'],
    ['SukukMikro_Distributions', 'SukukMikro_Distributions!A1:M10'],
    ['Sukuk_Payment_Schedule', 'Sukuk_Payment_Schedule!A1:L20'],
  ];

  let passed = 0;
  let failed = 0;
  for (const [name, range] of tests) {
    try {
      const rows = await readRange(range);
      console.log(`✅ ${name}: ${rows.length} rows`);
      if (rows[0]) console.log(`   Headers: ${rows[0].join(' | ')}`);
      if (rows.length > 1) console.log(`   Sample: ${rows[1].join(' | ')}`);
      passed++;
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} sheets`);
}

test();
