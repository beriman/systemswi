// Seed all formula data
const fs = require('fs');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA';
const TOKEN_PATH = '/home/ubuntu/.hermes/google_token.json';

async function main() {
  const creds = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret, 'http://localhost:1');
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.token || '',
    token_type: 'Bearer',
    expiry_date: creds.expiry_date || creds.expiry || 0,
  });
  const sheets = google.sheets({ version: 'v4', auth: oauth2 });

  // Read existing data
  const masterResult = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Formula_Master!A1:L100',
  });
  const existingRows = (masterResult.data.values || []).length - 1; // minus header
  console.log(`Existing Formula_Master data rows: ${existingRows}`);

  if (existingRows >= 3) {
    console.log('Seed data already exists. Skipping.');
    return;
  }

  const date = '2026-06-21';

  // ── Seed Formula 1: L'Arc~en~Scent EDP 30ml Rose ──
  const f1Id = 'F-ARC-001';
  const f1Ingredients = [
    ['F-ARC-001', 'INV-RM-001', 'Alcohol 96%', 'solvent', 15, 30, 35000, 525000, 'TBA', '15ml x Rp 35000/liter'],
    ['F-ARC-001', 'INV-RM-003', 'Fragrance Oil Rose', 'oil', 5, 10, 450000, 2250000, 'TBA', '5ml x Rp 450000/kg'],
    ['F-ARC-001', 'INV-RM-002', 'Fixative Base', 'fixative', 2, 4, 185000, 370000, 'TBA', '2ml x Rp 185000/kg'],
    ['F-ARC-001', 'INV-RM-004', 'DPG', 'additive', 14, 28, 28000, 392000, 'TBA', '14ml x Rp 28000/liter'],
    ['F-ARC-001', 'INV-RM-005', 'Distilled Water', 'other', 14, 28, 5000, 70000, 'TBA', '14ml x Rp 5000/liter'],
  ];
  const f1IngCost = 525000 + 2250000 + 370000 + 392000 + 70000;
  const f1Bottling = 150000, f1Packaging = 200000, f1Other = 50000;
  const f1TotalCost = f1IngCost + f1Bottling + f1Packaging + f1Other;
  const f1Hpp = Math.round(f1TotalCost / 50);
  const f1Price = Math.round(f1Hpp / (1 - 0.60));

  // ── Seed Formula 2: Pixel Potion EDP 30ml Ocean ──
  const f2Id = 'F-PXL-001';
  const f2Ingredients = [
    ['F-PXL-001', 'INV-RM-001', 'Alcohol 96%', 'solvent', 14, 28, 35000, 490000, 'TBA', '14ml x Rp 35000/liter'],
    ['F-PXL-001', 'INV-RM-006', 'Fragrance Oil Ocean', 'oil', 6, 12, 480000, 2880000, 'TBA', '6ml x Rp 480000/kg'],
    ['F-PXL-001', 'INV-RM-002', 'Fixative Base', 'fixative', 2, 4, 185000, 370000, 'TBA', '2ml x Rp 185000/kg'],
    ['F-PXL-001', 'INV-RM-004', 'DPG', 'additive', 14, 28, 28000, 392000, 'TBA', '14ml x Rp 28000/liter'],
    ['F-PXL-001', 'INV-RM-005', 'Distilled Water', 'other', 14, 28, 5000, 70000, 'TBA', '14ml x Rp 5000/liter'],
  ];
  const f2IngCost = 490000 + 2880000 + 370000 + 392000 + 70000;
  const f2Bottling = 150000, f2Packaging = 200000, f2Other = 50000;
  const f2TotalCost = f2IngCost + f2Bottling + f2Packaging + f2Other;
  const f2Hpp = Math.round(f2TotalCost / 30);
  const f2Price = Math.round(f2Hpp / (1 - 0.60));

  // ── Seed Formula 3: Nuscentza EDP 30ml Heritage ──
  const f3Id = 'F-NSC-001';
  const f3Ingredients = [
    ['F-NSC-001', 'INV-RM-001', 'Alcohol 96%', 'solvent', 13, 26, 35000, 455000, 'TBA', '13ml x Rp 35000/liter'],
    ['F-NSC-001', 'INV-RM-007', 'Fragrance Oil Heritage', 'oil', 7, 14, 420000, 2940000, 'TBA', '7ml x Rp 420000/kg'],
    ['F-NSC-001', 'INV-RM-002', 'Fixative Base', 'fixative', 3, 6, 185000, 555000, 'TBA', '3ml x Rp 185000/kg'],
    ['F-NSC-001', 'INV-RM-004', 'DPG', 'additive', 13, 26, 28000, 364000, 'TBA', '13ml x Rp 28000/liter'],
    ['F-NSC-001', 'INV-RM-005', 'Distilled Water', 'other', 14, 28, 5000, 70000, 'TBA', '14ml x Rp 5000/liter'],
  ];
  const f3IngCost = 455000 + 2940000 + 555000 + 364000 + 70000;
  const f3Bottling = 150000, f3Packaging = 200000, f3Other = 50000;
  const f3TotalCost = f3IngCost + f3Bottling + f3Packaging + f3Other;
  const f3Hpp = Math.round(f3TotalCost / 40);
  const f3Price = Math.round(f3Hpp / (1 - 0.60));

  console.log('Cost calculations:');
  console.log(`F-ARC-001: IngCost=${f1IngCost}, Total=${f1TotalCost}, HPP=${f1Hpp}, Price=${f1Price}`);
  console.log(`F-PXL-001: IngCost=${f2IngCost}, Total=${f2TotalCost}, HPP=${f2Hpp}, Price=${f2Price}`);
  console.log(`F-NSC-001: IngCost=${f3IngCost}, Total=${f3TotalCost}, HPP=${f3Hpp}, Price=${f3Price}`);

  // Append Master rows
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Formula_Master!A:L',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [
      [f1Id, 'brand-larc', "L'Arc~en~Scent", 'EDP 30ml Rose', 'ARC-EDP-30', 'Perfume', 50, 'ml', 'v1.0', 'Active', date, date],
      [f2Id, 'brand-pixel', 'Pixel Potion', 'EDP 30ml Ocean', 'PXL-EDP-30', 'Perfume', 30, 'ml', 'v1.0', 'Active', date, date],
      [f3Id, 'brand-nuscentza', 'Nuscentza', 'EDP 30ml Heritage', 'NSC-EDP-30', 'Perfume', 40, 'ml', 'v1.0', 'Active', date, date],
    ]},
  });
  console.log('✅ Formula_Master seeded');

  // Append Ingredients
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Formula_Ingredients!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [...f1Ingredients, ...f2Ingredients, ...f3Ingredients] },
  });
  console.log('✅ Formula_Ingredients seeded');

  // Append Cost Summary
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Formula_Cost_Summary!A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [
      [f1Id, f1IngCost, f1Bottling, f1Packaging, f1Other, f1Hpp, 60, f1Price, date],
      [f2Id, f2IngCost, f2Bottling, f2Packaging, f2Other, f2Hpp, 60, f2Price, date],
      [f3Id, f3IngCost, f3Bottling, f3Packaging, f3Other, f3Hpp, 60, f3Price, date],
    ]},
  });
  console.log('✅ Formula_Cost_Summary seeded');
  console.log('\n🎉 All seed data inserted successfully!');
}

main().catch(e => console.error('Error:', e.message));
