const { google } = require("googleapis");
const fs = require("fs");
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || "/home/ubuntu/.hermes/google_token.json";
const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, "http://localhost:1");
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token, token_type: "Bearer", expiry_date: content.expiry });
const sheets = google.sheets({ version: "v4", auth: oauth2 });

async function main() {
  const bp = await sheets.spreadsheets.values.get({
    spreadsheetId: "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
    range: "Brand_Production!A1:T5"
  });
  const rows = (bp.data.values || []);
  console.log("=== Brand_Production ===");
  console.log("Headers:", JSON.stringify(rows[0]));
  console.log("Row count:", rows.length);
  rows.forEach((row, i) => console.log("Row " + i + ":", JSON.stringify(row)));

  const bm = await sheets.spreadsheets.values.get({
    spreadsheetId: "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
    range: "Brand_Master!A1:K5"
  });
  const bmRows = (bm.data.values || []);
  console.log("\n=== Brand_Master ===");
  console.log("Headers:", JSON.stringify(bmRows[0]));
  bmRows.forEach((row, i) => console.log("Row " + i + ":", JSON.stringify(row)));
}
main().catch(e => console.error(e.message));
