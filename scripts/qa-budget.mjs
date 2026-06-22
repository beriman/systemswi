// Verify budget APIs are working
async function main() {
  const BASE = "https://systemswi.vercel.app";

  console.log("=== QA Checklist ===\n");

  // 1. GET /api/budget
  try {
    const r = await fetch(`${BASE}/api/budget?year=2026`);
    const d = await r.json();
    console.log(`1. GET /api/budget → ${r.status} ${r.ok ? '✓' : '✗'}`);
    console.log(`   count: ${d.count}, source: ${d.source}, status: ${d.sourceStatus}`);
    if (d.data && d.data.length > 0) {
      console.log(`   first: ${d.data[0].category} ${d.data[0].month} budget=${d.data[0].budget} actual=${d.data[0].actual}`);
    }
  } catch (e) {
    console.log(`1. GET /api/budget → ERROR: ${e.message}`);
  }

  // 2. GET /api/budget/summary
  try {
    const r = await fetch(`${BASE}/api/budget/summary`);
    const d = await r.json();
    console.log(`\n2. GET /api/budget/summary → ${r.status} ${r.ok ? '✓' : '✗'}`);
    const s = d.summary || {};
    console.log(`   totalBudget: ${s.totalBudget}, totalActual: ${s.totalActual}`);
    console.log(`   totalRemaining: ${s.totalRemaining}, overallPercent: ${s.overallPercent}%`);
    console.log(`   overBudget: ${s.overBudgetCount}, warning: ${s.warningCount}`);
  } catch (e) {
    console.log(`2. GET /api/budget/summary → ERROR: ${e.message}`);
  }

  // 3. GET /api/budget/alerts
  try {
    const r = await fetch(`${BASE}/api/budget/alerts`);
    const d = await r.json();
    console.log(`\n3. GET /api/budget/alerts → ${r.status} ${r.ok ? '✓' : '✗'}`);
    console.log(`   total alerts: ${d.total}`);
    for (const a of (d.alerts || [])) {
      console.log(`   [${a.level}] ${a.category} ${a.month}: ${a.percentUsed}%`);
    }
  } catch (e) {
    console.log(`3. GET /api/budget/alerts → ERROR: ${e.message}`);
  }

  // 4. POST /api/budget
  try {
    const testPayload = {
      category: "Test Category",
      month: "Jul-26",
      year: "2026",
      budget: 5000000,
      actual: 1000000,
      notes: "QA test entry",
    };
    const r = await fetch(`${BASE}/api/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });
    const d = await r.json();
    console.log(`\n4. POST /api/budget → ${r.status} ${r.status === 201 ? '✓' : '✗'}`);
    console.log(`   id: ${d.id}, success: ${d.success}`);
  } catch (e) {
    console.log(`4. POST /api/budget → ERROR: ${e.message}`);
  }

  // 5. UI /budget page
  try {
    const r = await fetch(`${BASE}/budget`);
    console.log(`\n5. GET /budget (UI) → ${r.status} ${r.ok ? '✓' : '✗'}`);
  } catch (e) {
    console.log(`5. GET /budget (UI) → ERROR: ${e.message}`);
  }

  // 6. GET /api/budget/by-category
  try {
    const r = await fetch(`${BASE}/api/budget/by-category`);
    const d = await r.json();
    console.log(`\n6. GET /api/budget/by-category → ${r.status} ${r.ok ? '✓' : '✗'}`);
    console.log(`   categories: ${(d.categories || []).length}`);
    for (const c of (d.categories || [])) {
      console.log(`   ${c.category}: ${c.percentUsed}% (${c.status})`);
    }
  } catch (e) {
    console.log(`6. GET /api/budget/by-category → ERROR: ${e.message}`);
  }

  // 7. GET /api/budget/by-event
  try {
    const r = await fetch(`${BASE}/api/budget/by-event`);
    const d = await r.json();
    console.log(`\n7. GET /api/budget/by-event → ${r.status} ${r.ok ? '✓' : '✗'}`);
    console.log(`   events: ${(d.events || []).length}`);
  } catch (e) {
    console.log(`7. GET /api/budget/by-event → ERROR: ${e.message}`);
  }

  console.log("\n=== Done ===");
}

main().catch(e => console.error(e));
