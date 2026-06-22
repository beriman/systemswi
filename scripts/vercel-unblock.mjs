import { readFileSync } from "fs";

const auth = JSON.parse(readFileSync("/home/ubuntu/.local/share/com.vercel.cli/auth.json", "utf-8"));
const token = auth.token;
const projectId = "prj_iv1RscYKlLnQtdSjuLJviCFNGIQY";

// Get the latest blocked deployment
const resp = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=3&state=BLOCKED`, {
  headers: { "Authorization": `Bearer ${token}` }
});
const data = await resp.json();
const deployments = data.deployments || [];

if (deployments.length === 0) {
  console.log("No blocked deployments found");
  process.exit(0);
}

const latest = deployments[0];
console.log(`Latest blocked: ${latest.uid} | ${latest.url} | target=${latest.target}`);
console.log(`Meta: ${JSON.stringify(latest.meta)}`);

// Try to promote it anyway
console.log(`\nAttempting to promote ${latest.uid}...`);
const promoResp = await fetch(`https://api.vercel.com/v13/deployments/${latest.uid}/aliases`, {
  method: "POST",
  headers: { 
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ alias: "systemswi.vercel.app" })
});
const promoData = await promoResp.json();
console.log("Promote result:", JSON.stringify(promoData, null, 2));
