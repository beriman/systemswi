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

async function main() {
  const token = await getAccessToken();

  const eventBudget = await sheetsGet(token, "Event_Budget!A1:H20");
  console.log("Event_Budget rows:", eventBudget.length);
  if (eventBudget.length > 0) console.log("Headers:", eventBudget[0]);
  for (let i = 1; i < Math.min(eventBudget.length, 5); i++) {
    console.log("Row", i, ":", eventBudget[i]);
  }

  const budget = await sheetsGet(token, "Budget_vs_Actual!A1:R500");
  console.log("\nBudget_vs_Actual rows:", budget.length);

  let alertCount = 0;
  for (let i = 1; i < budget.length; i++) {
    const row = budget[i];
    const b = Number(row[4]);
    const a = Number(row[5]);
    if (b > 0 && a / b >= 0.8) {
      alertCount++;
      console.log("ALERT:", row[1], row[2], Math.round((a / b) * 100) + "%");
    }
  }
  console.log("Total alerts:", alertCount);
}

main().catch(console.error);
