import { google } from "googleapis";
import fs from "fs";

const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";
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
  expiry_date: new Date(creds.expiry).getTime(),
});

async function main() {
  const drive = google.drive({ version: "v3", auth: oauth2 });
  const folderId = "1_CiweZyy-KVw8J2U_N0Z-cRdjoO0H_Oh";

  try {
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, modifiedTime)",
    });

    console.log("=== FILES IN FOLDER ===");
    if (data.files) {
      data.files.forEach((f) => {
        console.log(`${f.name} (${f.mimeType}) [${f.modifiedTime}]`);
        console.log(`  ID: ${f.id}`);
      });
    }

    // Cari file legal (akta, SK, PDF)
    console.log("\n=== FILES RELEVAN (PDF, Document, dll) ===");
    if (data.files) {
      const legalFiles = data.files.filter(f => 
        f.mimeType === "application/pdf" || 
        f.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        f.name.toLowerCase().includes("akta") ||
        f.name.toLowerCase().includes("legal") ||
        f.name.toLowerCase().includes("ahu") ||
        f.name.toLowerCase().includes("sk") ||
        f.name.toLowerCase().includes("saham") ||
        f.name.toLowerCase().includes("modal") ||
        f.name.toLowerCase().includes("document")
      );
      if (legalFiles.length > 0) {
        legalFiles.forEach((f) => console.log(`  ⭐ ${f.name} (${f.mimeType})`));
      } else {
        console.log("  Tidak ditemukan file legal spesifik.");
      }
    }
  } catch (e) {
    console.error("Error:", e.response?.data || e.message);
  }
}

main();
