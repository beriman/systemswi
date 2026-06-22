// Check full headers of Brand_Production
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

  // Get full header row
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Brand_Production!A1:Z2',
  });
  const rows = result.data.values || [];
  console.log('Full headers:');
  if (rows[0]) {
    rows[0].forEach((h, i) => {
      console.log(`  ${i}: ${h}`);
    });
  }
  console.log('\nFirst data row:');
  if (rows[1]) {
    rows[1].forEach((v, i) => {
      console.log(`  ${i}: ${v}`);
    });
  }
}

main().catch(console.error);
