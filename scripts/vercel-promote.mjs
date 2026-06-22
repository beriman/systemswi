import { readFileSync } from "fs";

const auth = JSON.parse(readFileSync("/home/ubuntu/.local/share/com.vercel.cli/auth.json", "utf-8"));
const token = auth.token;
const projectId = "prj_iv1RscYKlLnQtdSjuLJviCFNGIQY";

// List recent deployments
const resp = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`, {
  headers: { "Authorization": `Bearer ${token}` }
});
const data = await resp.json();
const deployments = data.deployments || [];

console.log("Recent deployments:");
for (const d of deployments) {
  console.log(`  ${d.uid} | ${d.state} | ${d.url} | ${d.createdAt}`);
}

// Find the latest ready deployment
const ready = deployments.find(d => d.state === "READY");
if (ready) {
  console.log(`\nPromoting ${ready.uid} to production...`);
  
  const promoResp = await fetch(`https://api.vercel.com/v13/deployments/${ready.uid}/aliases`, {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ alias: "systemswi.vercel.app" })
  });
  const promoData = await promoResp.json();
  console.log("Promote result:", JSON.stringify(promoData, null, 2));
} else {
  console.log("\nNo READY deployment found");
}
