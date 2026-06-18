const { google } = require("googleapis");
const fs = require("fs");
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || "/home/ubuntu/.hermes/google_token.json";
const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, "http://localhost:1");
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token, token_type: "Bearer", expiry_date: content.expiry });
const gmail = google.gmail({ version: "v1", auth: oauth2 });

async function getBody(msgData) {
  const parts = msgData.payload?.parts || [];
  const htmlPart = parts.find(p => p.mimeType === "text/html");
  if (htmlPart) {
    const html = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return "";
}

async function main() {
  console.log("=== BRI BPJS TRANSACTIONS ===");
  const bri = await gmail.users.messages.list({ userId: "me", q: "Bukti Transaksi BPJS Ketenagakerjaan", maxResults: 3 });
  for (const m of (bri.data.messages || [])) {
    const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    const body = await getBody(full.data);
    console.log("Date:", h.date);
    console.log("Body:", body.substring(0, 600) || "(empty)");
    const allParts = full.data.payload?.parts || [];
    console.log("Parts:", allParts.map(p => p.mimeType));
    for (const part of allParts) {
      if (part.body?.data) {
        const decoded = Buffer.from(part.body.data, "base64").toString("utf-8");
        console.log("  Part:", decoded.substring(0, 300));
      }
    }
    console.log("---");
  }

  console.log("\n=== SIPP / PHK ===");
  const sipp = await gmail.users.messages.list({ userId: "me", q: "SIPP", maxResults: 3 });
  for (const m of (sipp.data.messages || [])) {
    const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "metadata", metadataHeaders: ["From","Subject","Date"] });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    console.log("From:", h.from, "| Subject:", h.subject, "| Date:", h.date);
  }

  console.log("\n=== BPJS KESEHATAN ===");
  const kesReg = await gmail.users.messages.list({ userId: "me", q: "BPJS Kesehatan pendaftaran", maxResults: 3 });
  console.log("Found:", (kesReg.data.messages || []).length);
  for (const m of (kesReg.data.messages || [])) {
    const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "metadata", metadataHeaders: ["From","Subject","Date"] });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    console.log("From:", h.from, "| Subject:", h.subject, "| Date:", h.date);
  }

  console.log("\n=== DATA TENAGA KERJA ===");
  const tk = await gmail.users.messages.list({ userId: "me", q: "tenaga kerja pegawai karyawan", maxResults: 5 });
  console.log("Found:", (tk.data.messages || []).length);
  for (const m of (tk.data.messages || [])) {
    const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "metadata", metadataHeaders: ["From","Subject","Date"] });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    console.log("From:", h.from, "| Subject:", h.subject, "| Date:", h.date);
  }
}
main().catch(e => console.error(e.message));
