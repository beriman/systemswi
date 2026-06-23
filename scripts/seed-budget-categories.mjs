// Seed Budget_Categories sheet
import { google } from "googleapis";
import fs from "fs";

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

function loadCredentials() {
  try {
    const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    return {
      client_id: content.client_id,
      client_secret: content.client_secret,
      refresh_token: content.refresh_token,
      access_token: content.token || content.access_token || "",
      expiry_date: content.expiry_date || content.expiry || 0,
    };
  } catch (e) {
    console.error("Failed to load credentials:", e.message);
    process.exit(1);
  }
}

const creds = loadCredentials();
const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret, "http://localhost:1");
oauth2.setCredentials({
  refresh_token: creds.refresh_token,
  access_token: creds.access_token,
  token_type: "Bearer",
  expiry_date: creds.expiry_date,
});

const sheets = google.sheets({ version: "v4", auth: oauth2 });

const categories = [
  ["CAT-001", "Bahan Baku", "Bahan baku utama produksi parfum: essential oil, alcohol, fixative"],
  ["CAT-002", "Iklan & Marketing", "Biaya pemasaran: social media ads, influencer, content creation"],
  ["CAT-003", "Sewa Booth", "Biaya sewa booth untuk event, bazaar, dan pop-up store"],
  ["CAT-004", "Packaging", "Botol, label, box, dan kemasan produk"],
  ["CAT-005", "Transport", "Biaya pengiriman, logistik, dan transportasi operasional"],
];

const headers = ["Category ID", "Category Name", "Description"];
const allRows = [headers, ...categories];

console.log("Seeding Budget_Categories...");

try {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: "Budget_Categories!A1:D50",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: "Budget_Categories!A1:D50",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: allRows },
  });

  console.log(`Seeded ${categories.length} budget categories!`);
} catch (error) {
  console.error("Failed:", error.message);
  if (error.response) {
    console.error("Response:", JSON.stringify(error.response.data, null, 2));
  }
  process.exit(1);
}
