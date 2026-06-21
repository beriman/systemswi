// Check and seed Formula sheets
const fs = require('fs');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA';
const TOKEN_PATH = '/home/ubuntu/.hermes/google_token.json';

async function main() {
  const creds = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  
  const oauth2 = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    'http://localhost:1'
  );
  oauth2.setCredentials({
    refresh_token: creds.refresh_token,
    access_token: creds.token || creds.access_token || '',
    token_type: 'Bearer',
    expiry_date: creds.expiry_date || creds.expiry || 0,
  });

  const sheets = google.sheets({ version: 'v4', auth: oauth2 });

  // Check existing sheets
  const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = ss.data.sheets.map(s => s.properties.title);
  console.log('Existing sheets:', sheetNames);
  
  const hasFM = sheetNames.includes('Formula_Master');
  const hasFI = sheetNames.includes('Formula_Ingredients');
  const hasFCS = sheetNames.includes('Formula_Cost_Summary');
  
  console.log('Formula_Master:', hasFM);
  console.log('Formula_Ingredients:', hasFI);
  console.log('Formula_Cost_Summary:', hasFCS);

  if (hasFM) {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Formula_Master!A1:L10',
    });
    const rows = result.data.values || [];
    console.log('Formula_Master rows:', rows.length);
    if (rows.length > 0) console.log('Headers:', rows[0]);
    if (rows.length > 1) console.log('Data row 1:', rows[1]);
  }
}

main().catch(e => console.error('Error:', e.message));
