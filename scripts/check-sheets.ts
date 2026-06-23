import { google } from 'googleapis';
import fs from 'fs';
const content = JSON.parse(fs.readFileSync('/home/ubuntu/.hermes/google_token.json', 'utf-8'));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, 'http://localhost:1');
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token || content.access_token, token_type: 'Bearer', expiry_date: content.expiry_date || content.expiry || 0 });
const sheets = google.sheets({ version: 'v4', auth: oauth2 });

async function main() {
  const ss = await sheets.spreadsheets.get({ spreadsheetId: '1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA', fields: 'sheets.properties.title' });
  console.log('Sheet titles:', ss.data.sheets?.map(s => s.properties?.title));
}

main().catch(console.error);
