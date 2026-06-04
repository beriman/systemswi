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

  // List files in the folder
  const folderId = "1_CiweZyy-KVw8J2U_N0Z-cRdjoO0H_Oh";
  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime, webViewLink)",
    orderBy: "modifiedTime desc",
  });

  console.log(`=== FILES IN FOLDER (${folderId}) ===\n`);
  if (data.files && data.files.length > 0) {
    data.files.forEach((f, i) => {
      console.log(`${i + 1}. ${f.name}`);
      console.log(`   ID: ${f.id}`);
      console.log(`   Type: ${f.mimeType}`);
      console.log(`   Modified: ${f.modifiedTime}`);
      console.log(`   Link: ${f.webViewLink}`);
      console.log();
    });
  } else {
    console.log("No files found in folder.");
  }

  // Also check subfolders
  const { data: subfolders } = await drive.files.list({
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
  });

  if (subfolders.files && subfolders.files.length > 0) {
    console.log("=== SUBFOLDERS ===");
    for (const sf of subfolders.files) {
      console.log(`\n📁 ${sf.name} (${sf.id})`);
      const { data: subFiles } = await drive.files.list({
        q: `'${sf.id}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, modifiedTime)",
      });
      if (subFiles.files) {
        subFiles.files.forEach((f) => {
          console.log(`   - ${f.name} (${f.mimeType})`);
        });
      }
    }
  }
}

main().catch(e => console.error(e.message));
