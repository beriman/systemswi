import fs from "fs";

const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";
const creds = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";

async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    refresh_token: creds.refresh_token,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  return data.access_token;
}

async function sheetsGet(accessToken, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.values || [];
}

async function sheetsClear(accessToken, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
  return res.json();
}

async function sheetsUpdate(accessToken, range, values) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  return res.json();
}

const EVENTS = [
  { id: "EVT-001", name: "Fragrantions Expo 2026" },
  { id: "EVT-002", name: "Indonesia Perfume Festival" },
  { id: "EVT-003", name: "Beauty & Wellness Expo" },
  { id: "EVT-004", name: "Ramadan Bazaar" },
  { id: "EVT-005", name: "Year-End Pop-up" },
];

const CATEGORIES = [
  { name: "Booth & Venue", items: ["Sewa Booth", "Dekorasi", "Listrik"] },
  { name: "Marketing", items: ["Banner & Poster", "Digital Ads", "Sampling"] },
  { name: "Logistics", items: ["Transportasi", "Packing", "Storage"] },
  { name: "Staffing", items: ["Event Staff", "Koordinator", "Dokumentasi"] },
];

function randBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

async function main() {
  console.log("🔑 Getting access token...");
  const token = await getAccessToken();

  // Check existing
  const existing = await sheetsGet(token, "Event_Budget!A1:H1000");
  const hasData = existing.length > 1 && existing.slice(1).some(r => r.some(c => String(c).trim() !== ""));
  if (hasData) {
    console.log("Clearing existing Event_Budget data...");
    await sheetsClear(token, "Event_Budget!A1:H1000");
  }

  const rows = [];
  let itemId = 1;

  for (const event of EVENTS) {
    // Pick 2-3 categories per event
    const cats = CATEGORIES.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
    for (const cat of cats) {
      for (const item of cat.items) {
        const planned = randBetween(500000, 3000000);
        const actualPct = 0.5 + Math.random() * 0.55;
        const actual = Math.round(planned * actualPct / 1000) * 1000;
        rows.push([
          `EBI-${String(itemId).padStart(4, "0")}`,
          event.id,
          cat.name,
          item,
          planned,
          actual,
          `Event budget for ${event.name}`,
          new Date().toISOString().split("T")[0],
        ]);
        itemId++;
      }
    }
  }

  const headers = ["ID", "Event ID", "Category", "Item Name", "Planned Amount", "Actual Amount", "Notes", "Created"];
  const allRows = [headers, ...rows];
  const paddedRows = allRows.map(row => {
    const padded = [...row];
    while (padded.length < 8) padded.push("");
    return padded;
  });

  // Pad to 1000 rows
  while (paddedRows.length < 1000) paddedRows.push(Array(8).fill(""));

  console.log(`📝 Writing ${rows.length} event budget entries...`);
  await sheetsUpdate(token, "Event_Budget!A1:H1000", paddedRows);
  console.log("✅ Event Budget seed complete!");
  console.log(`  Events: ${EVENTS.length}`);
  console.log(`  Total line items: ${rows.length}`);
}

main().catch(e => { console.error("❌ Error:", e.message); process.exit(1); });
