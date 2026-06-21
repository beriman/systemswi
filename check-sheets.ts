import { readRanges } from "./src/lib/sheets/sheets-real";

async function main() {
  const data = await readRanges([
    "Formula_Master!A1:L1000",
    "Formula_Ingredients!A1:J1000",
    "Formula_Cost_Summary!A1:I1000",
  ]);
  const master = data["Formula_Master!A1:L1000"] || [];
  const ing = data["Formula_Ingredients!A1:J1000"] || [];
  const cost = data["Formula_Cost_Summary!A1:I1000"] || [];
  console.log("=== FORMULA MASTER ===");
  master.forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));
  console.log("\n=== INGREDIENTS ===");
  ing.forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));
  console.log("\n=== COST SUMMARY ===");
  cost.forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));
}

main().catch(console.error);
