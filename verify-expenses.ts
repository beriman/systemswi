import { readExpenseSheet, EXPENSE_SHEETS, appendExpenseRows } from './src/lib/expense/sheets';

async function main() {
  const subs = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
  console.log('=== Expense_Submissions ===');
  console.log(`Rows: ${subs.length} (header + ${subs.length - 1} data)`);
  subs.forEach((row, i) => console.log(`  Row ${i}:`, JSON.stringify(row)));

  const aprs = await readExpenseSheet(EXPENSE_SHEETS.Approvers);
  console.log('\n=== Expense_Approvers ===');
  console.log(`Rows: ${aprs.length} (header + ${aprs.length - 1} data)`);
  if (aprs.length <= 1) {
    console.log('No approvers seeded yet. Adding...');
    await appendExpenseRows(EXPENSE_SHEETS.Approvers, [
      ['APR-001', 'Beriman Juliano', 'Direktur', 'beriman@swi.id'],
    ]);
    console.log('✅ Approver seeded.');
  } else {
    aprs.forEach((row, i) => console.log(`  Row ${i}:`, JSON.stringify(row)));
  }
}

main().catch(console.error);
