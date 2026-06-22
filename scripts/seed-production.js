// Seed production analytics data into Google Sheets
const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA';
const TOKEN_PATH = '/home/ubuntu/.hermes/google_token.json';

const PRODUCTION_HEADERS = [
  'Production ID', 'Date', 'Brand', 'SKU', 'Product',
  'Batch Code', 'Qty', 'Unit', 'Raw Material Cost', 'Bottling Cost',
  'Packaging Cost', 'Other Cost', 'HPP/Unit', 'Total Production Cost',
  'Status', 'QC Status', 'Stock Location', 'Notes', 'Target HPP', 'Achievement %',
];

const WASTE_HEADERS = [
  'Waste ID', 'Date', 'Production ID', 'Batch Code', 'Brand',
  'Product', 'Qty Rejected', 'Reason', 'Disposition', 'Cost Impact', 'Notes',
];

const TARGETS_HEADERS = [
  'Target ID', 'Brand', 'Month', 'Target Qty', 'Actual Qty', 'Achievement %',
];

const SEED_PRODUCTION = [
  ['PROD-2026-001', '2026-01-15', 'Aura Bloom', 'AB-100', 'Aura Bloom EDP 100ml', 'BATCH-2026-01-15-1001', '500', 'ml', '15000000', '5000000', '3000000', '2000000', '40000', '25000000', 'Done', 'Passed', 'Gudang A', 'First batch of the year', '40000', '100'],
  ['PROD-2026-002', '2026-02-10', 'Lumière', 'LM-50', 'Lumière Mist 50ml', 'BATCH-2026-02-10-2001', '800', 'ml', '12000000', '4000000', '2500000', '1500000', '23750', '20000000', 'Done', 'Passed', 'Gudang B', 'Valentine edition', '24000', '99'],
  ['PROD-2026-003', '2026-03-20', 'Noir Essence', 'NE-75', 'Noir Essence EDT 75ml', 'BATCH-2026-03-20-3001', '300', 'ml', '18000000', '6000000', '4000000', '2000000', '66667', '30000000', 'Done', 'Passed', 'Gudang A', 'Premium line', '65000', '102'],
  ['PROD-2026-004', '2026-04-05', 'Aura Bloom', 'AB-30', 'Aura Bloom Roller 30ml', 'BATCH-2026-04-05-4001', '1200', 'ml', '8000000', '3000000', '2000000', '1000000', '11667', '14000000', 'Done', 'Passed', 'Gudang A', 'Travel size', '12000', '97'],
  ['PROD-2026-005', '2026-05-18', 'Velvet Cloud', 'VC-100', 'Velvet Cloud EDP 100ml', 'BATCH-2026-05-18-5001', '400', 'ml', '20000000', '8000000', '5000000', '3000000', '65000', '36000000', 'In Progress', 'Unchecked', 'Gudang C', 'New launch', '60000', '0'],
];

const SEED_WASTE = [
  ['W-2026-001', '2026-01-15', 'PROD-2026-001', 'BATCH-2026-01-15-1001', 'Aura Bloom', 'Aura Bloom EDP 100ml', '15', 'Off-note on mixing', 'Scrap', '600000', 'Raw material contamination'],
  ['W-2026-002', '2026-03-20', 'PROD-2026-003', 'BATCH-2026-03-20-3001', 'Noir Essence', 'Noir Essence EDT 75ml', '8', 'Packaging misalignment', 'Rework', '200000', 'Label repositioning needed'],
  ['W-2026-003', '2026-05-18', 'PROD-2026-005', 'BATCH-2026-05-18-5001', 'Velvet Cloud', 'Velvet Cloud EDP 100ml', '22', 'Bottle crack on filling', 'Scrap', '1430000', 'Machine calibration issue'],
];

const SEED_TARGETS = [
  ['TGT-2026-001', 'Aura Bloom', '2026-01', '500', '500', '100.00'],
  ['TGT-2026-002', 'Lumière', '2026-02', '800', '800', '100.00'],
  ['TGT-2026-003', 'Noir Essence', '2026-03', '300', '300', '100.00'],
];

async function main() {
  // Load credentials
  const creds = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  
  const oauth2 = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    'http://localhost:1'
  );
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.token,
    token_type: 'Bearer',
    expiry_date: creds.expiry_date || creds.expiry || 0,
  });

  const sheets = google.sheets({ version: 'v4', auth: oauth2 });

  // Check existing data
  console.log('Checking existing Brand_Production data...');
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Brand_Production!A1:T10',
  });
  const existingRows = existing.data.values || [];
  console.log(`Found ${existingRows.length} rows (including header)`);
  if (existingRows.length > 0) {
    console.log('Headers:', existingRows[0]?.slice(0, 6));
  }
  for (let i = 1; i < existingRows.length; i++) {
    console.log(`  Row ${i}:`, existingRows[i]?.slice(0, 6));
  }

  // Check Production_Waste
  console.log('\nChecking Production_Waste...');
  try {
    const wasteExisting = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Production_Waste!A1:K5',
    });
    const wasteRows = wasteExisting.data.values || [];
    console.log(`Found ${wasteRows.length} rows in Production_Waste`);
    if (wasteRows.length > 0) console.log('Headers:', wasteRows[0]);
    for (let i = 1; i < wasteRows.length; i++) {
      console.log(`  Row ${i}:`, wasteRows[i]?.slice(0, 5));
    }
  } catch (e) {
    console.log('Production_Waste sheet may not exist yet:', e.message);
  }

  // Check Production_Targets
  console.log('\nChecking Production_Targets...');
  try {
    const targetsExisting = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Production_Targets!A1:F5',
    });
    const targetsRows = targetsExisting.data.values || [];
    console.log(`Found ${targetsRows.length} rows in Production_Targets`);
    if (targetsRows.length > 0) console.log('Headers:', targetsRows[0]);
    for (let i = 1; i < targetsRows.length; i++) {
      console.log(`  Row ${i}:`, targetsRows[i]);
    }
  } catch (e) {
    console.log('Production_Targets sheet may not exist yet:', e.message);
  }
}

main().catch(console.error);
