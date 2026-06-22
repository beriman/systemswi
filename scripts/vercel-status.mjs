import { readFileSync } from "fs";

const auth = JSON.parse(readFileSync("/home/ubuntu/.local/share/com.vercel.cli/auth.json", "utf-8"));
const token = auth.token;
const projectId = "prj_iv1RscYKlLnQtdSjuLJviCFNGIQY";

// List more deployments including all states
const resp = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=20`, {
  headers: { "Authorization": `Bearer ${token}` }
});
const data = await resp.json();
const deployments = data.deployments || [];

console.log("All recent deployments:");
for (const d of deployments) {
  console.log(`  ${d.uid} | ${d.state} | ${d.url} | target=${d.target} | meta=${JSON.stringify(d.meta || {}).slice(0,80)}`);
}

// Check production alias
const aliasResp = await fetch(`https://api.vercel.com/v4/aliases?projectId=${projectId}&limit=10`, {
  headers: { "Authorization": `Bearer ${token}` }
});
const aliasData = await aliasResp.json();
console.log("\nAliases:", JSON.stringify(aliasData, null, 2).slice(0, 500));
