const { google } = require("googleapis");
const fs = require("fs");
const content = JSON.parse(fs.readFileSync("/tmp/gtoken.json", "utf-8"));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, "http://localhost:1");
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token, token_type: "Bearer", expiry_date: content.expiry });
const drive = google.drive({ version: "v3", auth: oauth2 });

const memoryContent = [
  "# SWI Long Memory",
  "> Disimpan di Google Drive, di-sync ke system prompt setiap session.",
  "> Terakhir diupdate: 2026-06-19",
  "",
  "## Production & Inventory (2026-06-19)",
  "- Production module: full CRUD via /api/brands (POST production/update-batch/delete-batch)",
  "- Real-time write ke Google Sheets Brand_Production",
  "- Inventory module: full CRUD via /api/inventory/items + /api/inventory movement",
  "- Real-time write ke Google Sheets Inventory_Master + Inventory_Movements",
  "- Kedua module sudah live di systemswi.vercel.app",
  "",
  "## Google OAuth",
  "- Token: /home/ubuntu/.hermes/google_token.json",
  "- Client ID: 378622421453-1hmk3i03q0d96beggvpn0un242epjlk9",
  "- Scopes: sheets, drive, documents, gmail.readonly, gmail.send, userinfo.email",
  "- Vercel env vars sudah set — OAuth works in production",
  "- Vercel project ID: prj_iv1RscYKlLnQtdSjuLJviCFNGIQY",
  "- Vercel token: vcp_4vHq8GJkALVfmjpTN9xiySxXn43yvJTblf07Y6nfjPiPjUvdZp26odA0",
  "",
  "## BPJS",
  "- BPJS Ketenagakerjaan: NPP 25216707-000, iuran ~Rp 394.107/bln via BNI, AKTIF",
  "- BPJS Kesehatan: BELUM TERDAFTAR (hanya email pendaftaran 21 Okt 2025)",
  "- Page /bpjs live",
  "",
  "## Cron Jobs",
  "- 92d9abb062dc: SWI 2.0 Agent-First Builder — ACTIVE, every 60m",
  "- 926946732bf7: SWI Roadmap Hourly Builder — PAUSED",
  "- b75110c1e0c0: SWI Development Health Check — PAUSED",
  "",
  "## Finance Spreadsheet",
  "- Keuangan PT Sensasi Wangi Indonesia ID: 1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA",
  "- 50+ sheets, REAL data (Rekening_Koran BRI per Mei 2026, Rekap_Rekening 8 bulan, PemegangSaham)",
  "- Sheets-real.ts SPREADSHEET_ID must point here",
  "",
  "## Google Drive Hermes Memory",
  "- Root: 1GwfFgXJh-KzudaaFJGDjF1xWx-SryGS5",
  "- SWI subfolder: 1477XPKhckSMW_bpLzdbItSJvrYtD5FRl",
  "- Subfolders: SWI/, Projects/, Finance/, Events/, Archive/",
  "- README: https://docs.google.com/document/d/1mpPB_jHvX_2WxaN5TNZgzMzPZb6_M-jvPmCU5iEY4z4/edit",
  "- Memory Log: https://docs.google.com/document/d/1jCBaspDMsLRIGjrrXjHnzV0cfBMTHQhp9Az8p2FAyu8/edit",
  "- 02_Data Perusahaan/ folder: 18tlo817AeAdPxe74vayrJHoSD_L0HZUa",
].join("\n");

const readable = require("stream").Readable;
const stream = new readable();
stream.push(memoryContent);
stream.push(null);

drive.files.create({
  requestBody: {
    name: "memory-long.md",
    mimeType: "text/markdown",
    parents: ["1477XPKhckSMW_bpLzdbItSJvrYtD5FRl"],
  },
  media: {
    mimeType: "text/markdown",
    body: stream,
  },
  fields: "id,name,webViewLink",
}).then(r => {
  console.log("Created:", JSON.stringify(r.data, null, 2));
}).catch(e => console.error("Error:", e.message));
