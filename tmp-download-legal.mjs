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

  // Download PT SENSASI WANGI INDONESIA.doc
  const fileId = "1JYv3NsgAYHxsHai8C3vjd3R2xt6q9YNL";
  const dest = "/home/ubuntu/systemswi/tmp-pt-sensasi-wangi.doc";

  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  await new Promise((resolve, reject) => {
    const destStream = fs.createWriteStream(dest);
    res.data.pipe(destStream);
    destStream.on("finish", resolve);
    destStream.on("error", reject);
  });

  console.log("✓ Downloaded PT SENSASI WANGI INDONESIA.doc");

  // Also download the docx
  const fileId2 = "139um5si2xqLYQExqtj0Z3BQS-Tde5sly";
  const dest2 = "/home/ubuntu/systemswi/tmp-kbli.docx";

  const res2 = await drive.files.get(
    { fileId: fileId2, alt: "media" },
    { responseType: "stream" }
  );

  await new Promise((resolve, reject) => {
    const destStream = fs.createWriteStream(dest2);
    res2.data.pipe(destStream);
    destStream.on("finish", resolve);
    destStream.on("error", reject);
  });

  console.log("✓ Downloaded KBLI USAHA docx");

  // Also download NIB.PDF
  const fileId3 = "1HpBMG5vL5g2NcVMFDdPsfalKkRYovlOJ";
  const dest3 = "/home/ubuntu/systemswi/tmp-nib.pdf";

  const res3 = await drive.files.get(
    { fileId: fileId3, alt: "media" },
    { responseType: "stream" }
  );

  await new Promise((resolve, reject) => {
    const destStream = fs.createWriteStream(dest3);
    res3.data.pipe(destStream);
    destStream.on("finish", resolve);
    destStream.on("error", reject);
  });

  console.log("✓ Downloaded NIB.PDF");

  // Also check subfolder "00_Hasil Pelajari"
  const { data } = await drive.files.list({
    q: `'1XTkfYnmjYRcrBT_4kfiu3wEu1imMdx9W' in parents and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime)",
  });

  console.log("\n=== SUBFOLDER: 00_Hasil Pelajari ===");
  if (data.files) {
    data.files.forEach((f) => console.log(`  ${f.name} (${f.mimeType})`));
  }
}

main().catch(e => console.error(e.message));
