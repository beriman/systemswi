// Seed expense data to Google Sheets
import { appendExpenseRows, ensureExpenseSheet, initializeExpenseSheets, EXPENSE_SHEETS, readExpenseSheet } from './src/lib/expense/sheets';

async function main() {
  console.log('Initializing expense sheets...');
  await initializeExpenseSheets();

  // Check existing data
  const existing = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  console.log(`Existing submissions: ${existing.length - 1} rows`);

  if (existing.length > 1) {
    console.log('Data already seeded. Skipping.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  // 5 sample submissions
  const submissions = [
    [
      'EXP-001', lastWeek, 'Beriman Juliano', 'Pekan Parfum Indonesia 2026',
      'Sewa Booth', 'Sewa booth utama hall A', 3500000, '',
      'Approved', 'Beriman Juliano', lastWeek, 'Approved - booth premium'
    ],
    [
      'EXP-002', lastWeek, 'Wapiq Rizya Zaelan', 'Pekan Parfum Indonesia 2026',
      'Iklan', 'Iklan Instagram & TikTok campaign', 1250000, '',
      'Approved', 'Beriman Juliano', yesterday, 'Approved - digital marketing'
    ],
    [
      'EXP-003', yesterday, 'Beriman Juliano', 'Produksi Batch #047',
      'Bahan Baku', 'Pembelian essential oil rose & sandalwood', 2800000, '',
      'Pending', '', '', ''
    ],
    [
      'EXP-004', yesterday, 'Wapiq Rizya Zaelan', 'Event Pop-up Mall Taman Anggrek',
      'Transport', 'Ongkir pengiriman merchandise & sampel', 450000, '',
      'Pending', '', '', ''
    ],
    [
      'EXP-005', today, 'Beriman Juliano', 'Produksi Batch #047',
      'Packaging', 'Botol kaca 50ml + box premium', 1750000, '',
      'Rejected', 'Beriman Juliano', today, 'Rejected - perlu revisi spec packaging'
    ],
  ];

  console.log('Seeding 5 expense submissions...');
  await appendExpenseRows(EXPENSE_SHEETS.Submissions, submissions);
  console.log('✅ Submissions seeded.');

  // 1 approver
  const approvers = [
    ['APR-001', 'Beriman Juliano', 'Direktur', 'beriman@swi.id'],
  ];

  console.log('Seeding approver...');
  await appendExpenseRows(EXPENSE_SHEETS.Approvers, approvers);
  console.log('✅ Approver seeded.');

  console.log('\n✅ All seed data written to Google Sheets!');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
