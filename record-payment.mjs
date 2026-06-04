// Record cicilan saham Beriman — Rp 7.000.000
// Tanggal: 2026-06-04
import { google } from "googleapis";
import fs from "fs";
import Database from "better-sqlite3";
import * as path from "path";

const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";
const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";
const DB_PATH = path.join(process.cwd(), "systemswi", ".data", "systemswi.db");

const creds = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));

const oauth2 = new google.auth.OAuth2(
  creds.client_id,
  creds.client_secret,
  "http://localhost:1"
);
oauth2.setCredentials({
  refresh_token: creds.refresh_token,
  access_token: creds.token,
  token_type: "Bearer",
  expiry_date: creds.expiry_date || Date.now() + 3600000,
});

const sheetsApi = google.sheets({ version: "v4", auth: oauth2 });

const tanggal = "04/06/2026";
const jumlah = 7000000;
const pengirim = "Beriman Juliano";
const penerima = "SWI Holding";
const noRek = "201101000546304";
const bank = "BRI";
const keterangan = "Cicilan setoran bayar saham";

console.log("=== Recording Transaction ===");
console.log(`Tanggal: ${tanggal}`);
console.log(`Jumlah: Rp ${jumlah.toLocaleString("id-ID")}`);
console.log(`Dari: ${pengirim}`);
console.log(`Ke: ${penerima} (${noRek})`);
console.log(`Keterangan: ${keterangan}`);

// ── 1. Update SQLite ──
try {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Insert transaction
  db.prepare(`
    INSERT INTO transactions (tanggal, jenis, kategori, deskripsi, jumlah, sumber, referensi)
    VALUES (?, 'pemasukan', 'Setoran Modal', ?, ?, 'BRI Holding', ?)
  `).run(
    "2026-06-04",
    `Cicilan setoran saham ${pengirim}`,
    jumlah,
    keterangan
  );

  // Update investor paid amount
  db.prepare(`
    UPDATE investors SET sudah_setor = sudah_setor + ?, updated_at = datetime('now')
    WHERE nama LIKE ?
  `).run(jumlah, "%Beriman%");

  console.log("✅ SQLite updated");

  // Verify
  const tx = db.prepare("SELECT * FROM transactions ORDER BY id DESC LIMIT 1").get();
  console.log("Last transaction:", JSON.stringify(tx, null, 2));

  const inv = db.prepare("SELECT * FROM investors WHERE nama LIKE ?").get("%Beriman%");
  console.log("Investor:", JSON.stringify(inv, null, 2));

  db.close();
} catch (e) {
  console.log("⚠️ SQLite error (may not exist yet):", e.message);
}

// ── 2. Update Google Sheets ──
try {
  // 2a. Append to Rekening_Koran mutasi
  const mutasiRange = "Rekening_Koran!A10:L12";
  const { data: mutasiData } = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: mutasiRange,
  });

  // Find the last row with data
  const values = mutasiData.values || [];
  let lastRow = 10; // Start at row 10
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0]) {
      lastRow = 10 + i + 1;
      break;
    }
  }

  // Append mutasi row
  const mutasiRow = [
    tanggal,
    "SA001",
    bank,
    "Pemasukan",
    "H-700",
    "Setoran Modal",
    `Cicilan setoran saham ${pengirim}`,
    jumlah.toString(),
    "",
    (parseFloat(values[0]?.[7] || "17902946.80") + jumlah).toString(),
    "",
    keterangan,
  ];

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Rekening_Koran!A${lastRow}:L${lastRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [mutasiRow] },
  });
  console.log(`✅ Google Sheets Rekening_Koran updated at row ${lastRow}`);

  // 2b. Update PemegangSaham — Beriman's "Sudah Setor"
  const psRange = "PemegangSaham!A1:G16";
  const { data: psData } = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: psRange,
  });

  const psValues = psData.values || [];
  // Find Beriman's row (should be row 6, index 5)
  for (let i = 0; i < psValues.length; i++) {
    if (psValues[i][1] && psValues[i][1].includes("Beriman")) {
      const currentPaid = parseFloat((psValues[i][6] || "0").replace(/[^\d.-]/g, "")) || 0;
      const newPaid = currentPaid + jumlah;
      const rowNum = i + 1; // 1-indexed

      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `PemegangSaham!G${rowNum}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[newPaid.toString()]] },
      });
      console.log(`✅ PemegangSaham updated: Beriman sudah setor Rp ${newPaid.toLocaleString("id-ID")} (was Rp ${currentPaid.toLocaleString("id-ID")})`);
      break;
    }
  }

  // 2c. Update Rekening_Koran header — saldo akhir BRI Holding
  const koranRange = "Rekening_Koran!A5:D7";
  const { data: koranData } = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: koranRange,
  });

  const koranValues = koranData.values || [];
  for (let i = 0; i < koranValues.length; i++) {
    if (koranValues[i][1] === "201101000546304") {
      const currentSaldo = parseFloat((koranValues[i][3] || "0").replace(/[^\d.-]/g, "")) || 0;
      const newSaldo = currentSaldo + jumlah;
      const rowNum = i + 5; // header starts at row 5

      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Rekening_Koran!D${rowNum}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[newSaldo.toFixed(2)]] },
      });
      console.log(`✅ Rekening_Koran saldo updated: Rp ${newSaldo.toFixed(2)} (was Rp ${currentSaldo.toFixed(2)})`);
      break;
    }
  }

  console.log("\n=== ✅ ALL UPDATES COMPLETE ===");
} catch (e) {
  console.error("❌ Google Sheets error:", e.message);
}
