// Check Production_Waste and Production_Targets full headers
const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA';
const TOKEN_PATH = '/home/ubuntu/.hermes/google_token.json';

async function main() {
  const creds = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret, 'http://localhost:1');
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.token,
    token_type: 'Bearer',
    expiry_date: creds.expiry_date || creds.expiry || 0,
  });
  const sheets = google.sheets({ version: 'v4', auth: oauth2 });

  // Production_Waste
  console.log('=== Production_Waste ===');
  const waste = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Production_Waste!A1:K5',
  });
  const wasteRows = waste.data.values || [];
  if (wasteRows[0]) {
    wasteRows[0].forEach((h, i) => console.log(`  ${i}: ${h}`));
  }
  for (let i = 1; i < wasteRows.length; i++) {
    console.log(`  Data row ${i}:`);
    wasteRows[i].forEach((v, j) => console.log(`    ${j}: ${v}`));
  }

  // Production_Targets
  console.log('\n=== Production_Targets ===');
  const targets = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Production_Targets!A1:F5',
  });
  const targetRows = targets.data.values || [];
  if (targetRows[0]) {
    targetRows[0].forEach((h, i) => console.log(`  ${i}: ${h}`));
  }
  for (let i = 1; i < targetRows.length; i++) {
    console.log(`  Data row ${i}:`);
    targetRows[i].forEach((v, j) => console.log(`    ${j}: ${v}`));
  }
}

main().catch(console.error);
