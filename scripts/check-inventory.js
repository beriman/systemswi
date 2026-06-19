const { google } = require("googleapis");
const fs = require("fs");
const TOKEN_PATH="/hom...onst content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, "http://localhost:1");
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token, token_type: "Bearer", expiry_date: content.expiry });
const sheets = google.sheets({ version: "v4", auth: oauth2 });

async function main() {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
    range: "Inventory_Master!A1:O10"
  });
  const rows = r.data.values || [];
  console.log("Row count:", rows.length);
  if (rows.length > 0) console.log("Headers:", JSON.stringify(rows[0]));
  rows.forEach((row, i) => console.log("Row " + i + ":", JSON.stringify(row)));
}
main().catch(e => console.error(e.message));
