const fs = require('fs');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA';
const TOKEN_PATH='/home/ubuntu/.hermes/google_token.json';

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

  const [master, ingredients, costSummary] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Formula_Master!A1:L100' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Formula_Ingredients!A1:J100' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Formula_Cost_Summary!A1:I100' }),
  ]);

  console.log('=== Formula_Master ===');
  console.log('Total rows:', (master.data.values || []).length);
  (master.data.values || []).forEach((row, i) => console.log('  ' + i + ':', JSON.stringify(row)));

  console.log('');
  console.log('=== Formula_Ingredients ===');
  console.log('Total rows:', (ingredients.data.values || []).length);
  (ingredients.data.values || []).forEach((row, i) => console.log('  ' + i + ':', JSON.stringify(row)));

  console.log('');
  console.log('=== Formula_Cost_Summary ===');
  console.log('Total rows:', (costSummary.data.values || []).length);
  (costSummary.data.values || []).forEach((row, i) => console.log('  ' + i + ':', JSON.stringify(row)));
}

main().catch(e => console.error('Error:', e.message));
