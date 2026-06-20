const { google } = require("googleapis");
const fs = require("fs");
const content = JSON.parse(fs.readFileSync("/tmp/gtoken.json", "utf-8"));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, "http://localhost:1");
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token, token_type: "Bearer", expiry_date: content.expiry });
const sheets = google.sheets({ version: "v4", auth: oauth2 });

async function main() {
  const allSheets = [
    "Dashboard","Produksi","Event","Store","Ecommerse","RekapSetoran","Holding","PemegangSaham",
    "DivisiShareholders","SukukStore","SukukProduk","Brand_Tracking","Store_Daily","Event_Pipeline",
    "Ecommerse_Metrics","Sukuk_Reporting","KPI_Dashboard","Cashflow_Forecast","Rekening_Koran",
    "Laporan_Harian","COA","Cash_Harian","Buku_Kas","Budget_vs_Actual","Laporan_Bulanan",
    "Pajak_Tracking","Legal_Compliance","SOP_Store","Artisan_Program","Merch_TIM","Store_Daily_Log",
    "Cashflow_Aktual","Sukuk_Payment_Schedule","RAB_Store_TIM","RAB_Perbandingan_Skema",
    "Proyeksi_Cashflow_Store","Rekap_Rekening","Events","Event_Budget","Event_Tenants","Event_Sponsors",
    "Event_Timeline","Event_Dashboard","Brand_Master","Brand_Production","Brand_Sales","Brand_Expenses",
    "Brand_Dashboard","Inventory_Master","Inventory_Movements","Supplier_Master","Purchase_Orders",
    "Goods_Receipts","Compliance_Checks","Product_Batches","QC_Checklist","BPOM_Registry","BPOM_Timeline",
    "SukukMikro_Investments","SukukMikro_Distributions","Tax_Calendar","Tax_Documents","OSS_Status","Shared_Resources"
  ];

  const results = [];
  for (const name of allSheets) {
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
        range: name + "!A1:Z100"
      });
      const rows = r.data.values || [];
      const dataRows = Math.max(0, rows.length - 1);
      const headers = rows[0]?.slice(0, 8) || [];
      const headerStr = JSON.stringify(headers);
      // Check if it's a title/header-only sheet (single row with merged title)
      const isTitleOnly = rows.length <= 1 || (rows.length <= 2 && rows[1].every(c => !c));
      results.push({ name, dataRows, headers: headerStr, isTitleOnly });
    } catch(e) {
      results.push({ name, dataRows: -1, headers: "ERROR", isTitleOnly: false });
    }
  }

  // Sort by dataRows desc
  results.sort((a, b) => b.dataRows - a.dataRows);
  
  console.log("=== SHEETS WITH DATA (sorted by row count) ===");
  results.filter(r => r.dataRows > 0).forEach(r => {
    console.log(r.dataRows + " rows | " + r.name + " | " + r.headers);
  });
  
  console.log("\n=== EMPTY SHEETS (0 data rows) ===");
  results.filter(r => r.dataRows === 0).forEach(r => {
    console.log(r.name + " | " + r.headers);
  });
  
  console.log("\n=== TITLE-ONLY SHEETS ===");
  results.filter(r => r.isTitleOnly).forEach(r => {
    console.log(r.name + " | " + r.headers);
  });
}
main().catch(e => console.error(e.message));
