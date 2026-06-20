const { google } = require("googleapis");
const fs = require("fs");
const content = JSON.parse(fs.readFileSync("/tmp/gtoken.json", "utf-8"));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, "http://localhost:1");
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token, token_type: "Bearer", expiry_date: content.expiry });
const sheets = google.sheets({ version: "v4", auth: oauth2 });

const targetSheets = [
  "Supplier_Master","Purchase_Orders","Goods_Receipts",
  "Events","Event_Budget","Event_Tenants","Event_Sponsors","Event_Timeline","Event_Dashboard",
  "Store_Daily","Store_Daily_Log",
  "SukukStore","SukukProduk","SukukPayment_Schedule","SukukMikro_Investments","SukukMikro_Distributions",
  "Ecommerse","Ecommerse_Metrics",
  "Cashflow_Forecast","Cashflow_Aktual",
  "Laporan_Harian","Laporan_Bulanan",
  "Artisan_Program","Merch_TIM",
  "RAB_Store_TIM","RAB_Perbandingan_Skema",
  "Shared_Resources"
];

async function main() {
  for (const name of targetSheets) {
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
        range: name + "!A1:Z5"
      });
      const rows = r.data.values || [];
      const dataRows = Math.max(0, rows.length - 1);
      const headers = rows[0]?.slice(0, 6) || [];
      console.log(name + ": " + dataRows + " data rows | H: " + JSON.stringify(headers));
    } catch(e) {
      console.log(name + ": ERROR - " + e.message);
    }
  }
}
main().catch(e => console.error(e.message));
