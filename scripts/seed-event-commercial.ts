// Seed script for Event Commercial Pipeline — populates Event_Tenants, Event_Sponsors, Event_Budget
// Run: NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/seed-event-commercial.ts
import { writeRange, readRange } from "../src/lib/sheets/sheets-real";

const SPREADSHEET_ID = "1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA";

const today = new Date();
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function dateAdd(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}

// Event IDs from the existing Events sheet (we'll read them)
async function getEventIds(): Promise<string[]> {
  try {
    const rows = await readRange("Events!A2:A100");
    if (!rows || rows.length === 0) return [];
    return rows.map((r: string[]) => r[0]).filter(Boolean);
  } catch {
    // Fallback: use known event structure
    return ["evt-fragrantions-2026", "evt-workshop-jakarta", "evt-bazaar-bandung"];
  }
}

async function seedEventTenants(eventIds: string[]) {
  console.log("📊 Seeding Event_Tenants...");
  const HEADER = ["ID", "Event ID", "Brand Name", "Contact Person", "Email", "Phone", "Booth Number", "Booth Size", "Package Type", "Fee", "Payment Status", "Payment Amount", "Contract Date", "Notes", "Created"];

  const boothSizes = ["3x3m", "3x6m", "6x6m", "3x3m", "3x6m"];
  const packages: ("basic" | "premium" | "vip" | "sponsor")[] = ["premium", "basic", "vip", "basic", "premium"];
  const statuses: ("paid" | "partial" | "pending" | "waived")[] = ["paid", "paid", "partial", "pending", "paid"];
  const brandNames = [
    "PT Aroma Essence Indonesia",
    "CV Wangi Nusantara",
    "Tn. Rizky Pratama",
    "PT Parfum Lestari",
    "CV Sari Indah",
  ];
  const contactPersons = ["Andra Kusuma", "Siti Rahayu", "Budi Santoso", "Dewi Lestari", "Agus Setiawan"];
  const emails = ["andra@aroma.id", "siti@wangi.id", "rizky@parfum.id", "dewi@lestari.id", "agus@sari.id"];
  const phones = ["6281211110001", "628122220002", "628133330003", "628144440004", "628155550005"];

  const rows: (string | number)[][] = [];
  for (let i = 0; i < 5; i++) {
    const eventId = eventIds[i % eventIds.length] || eventIds[0];
    const boothNum = `B-${String(i + 1).padStart(2, "0")}`;
    const fee = packages[i] === "vip" ? 15000000 : packages[i] === "premium" ? 10000000 : packages[i] === "sponsor" ? 25000000 : 5000000;
    const paymentAmount = statuses[i] === "paid" ? fee : statuses[i] === "partial" ? Math.floor(fee * 0.5) : 0;
    rows.push([
      `TEN-${String(i + 1).padStart(3, "0")}`,
      eventId,
      brandNames[i],
      contactPersons[i],
      emails[i],
      phones[i],
      boothNum,
      boothSizes[i],
      packages[i],
      fee,
      statuses[i],
      paymentAmount,
      dateAdd(-30 + i * 5),
      `Seed data — validasi dengan PIC event`,
      fmtDate(today),
    ]);
  }

  await writeRange("Event_Tenants!A1:O1", [HEADER]);
  await writeRange("Event_Tenants!A2:O6", rows);
  console.log(`   ✅ ${rows.length} tenants seeded`);
}

async function seedEventSponsors(eventIds: string[]) {
  console.log("📊 Seeding Event_Sponsors...");
  const HEADER = ["ID", "Event ID", "Company Name", "Contact Person", "Email", "Phone", "Tier", "Sponsorship Amount", "In-Kind", "In-Kind Description", "In-Kind Value", "Payment Status", "Contract Date", "Logo URL", "Notes", "Created"];

  const tiers: ("platinum" | "gold" | "silver" | "bronze" | "media")[] = ["platinum", "gold", "silver", "media", "bronze"];
  const statuses: ("paid" | "partial" | "pending" | "declined")[] = ["paid", "paid", "partial", "paid", "pending"];
  const companyNames = [
    "PT Bank Syariah Mandiri",
    "PT Parfum Nusantara",
    "CV Berkah Wangi",
    "PT Media Indonesia",
    "Sariwangi Florist",
  ];
  const contacts = ["Andi Wijaya", "Maya Sari", "Hendra Gunawan", "Lisa Marlina", "Bambang Hermanto"];
  const emailsCorp = ["sponsorship@bsm.co.id", "marketing@parfumnusantara.co.id", "info@berkahwangi.id", "ads@mediaindonesia.id", "partnership@sariwangi.id"];
  const phonesCorp = ["021-5556789", "021-5557890", "021-5558901", "021-5559012", "021-5560123"];
  const amounts = [25000000, 15000000, 8000000, 5000000, 3000000];
  const inKindDescs = ["", "Free product samples worth 2M", "", "Media coverage worth 5M", "Fresh flowers decoration"];
  const inKindValues = [0, 2000000, 0, 5000000, 1000000];

  const rows: (string | number)[][] = [];
  for (let i = 0; i < 5; i++) {
    const eventId = eventIds[i % eventIds.length] || eventIds[0];
    const paymentAmount = statuses[i] === "paid" ? amounts[i] + inKindValues[i] : statuses[i] === "partial" ? Math.floor((amounts[i] + inKindValues[i]) * 0.5) : 0;
    rows.push([
      `SPN-${String(i + 1).padStart(3, "0")}`,
      eventId,
      companyNames[i],
      contacts[i],
      emailsCorp[i],
      phonesCorp[i],
      tiers[i],
      amounts[i],
      inKindValues[i] > 0 ? "Yes" : "No",
      inKindDescs[i] || "",
      inKindValues[i],
      statuses[i],
      dateAdd(-45 + i * 7),
      "",
      `Seed data — ${tiers[i]} tier sponsor`,
      fmtDate(today),
    ]);
  }

  await writeRange("Event_Sponsors!A1:P1", [HEADER]);
  await writeRange("Event_Sponsors!A2:P6", rows);
  console.log(`   ✅ ${rows.length} sponsors seeded`);
}

async function seedEventBudget(eventIds: string[]) {
  console.log("📊 Seeding Event_Budget...");
  const HEADER = ["ID", "Event ID", "Category", "Item Name", "Planned Amount", "Actual Amount", "Notes", "Created"];

  const categories = ["venue", "equipment", "marketing", "staff", "catering", "entertainment", "logistics", "permit", "misc"];
  const items = [
    ["Sewa venue Jakarta Convention Center", 50000000, 48000000],
    ["Sound system & lighting rental", 15000000, 14500000],
    ["Digital marketing campaign (Instagram, TikTok)", 10000000, 9500000],
    ["Staff event (panitia + MC)", 8000000, 8200000],
    ["Konsumsi VIP & tenant", 12000000, 11500000],
    ["Entertainment (band + DJ)", 20000000, 2000000],
    ["Transportasi & akomodasi tamu", 8000000, 7500000],
    ["Perizinan (OSS, polisi, BPOM display)", 3000000, 3000000],
    ["Dokumentasi & videography", 5000000, 4800000],
  ];

  const rows: (string | number)[][] = [];
  for (let i = 0; i < items.length; i++) {
    const eventId = eventIds[0] || "evt-fragrantions-2026";
    rows.push([
      `BUD-${String(i + 1).padStart(3, "0")}`,
      eventId,
      categories[i] || "misc",
      items[i][0],
      items[i][1],
      items[i][2],
      "Seed data — RAB event Fragrantions",
      fmtDate(today),
    ]);
  }

  await writeRange("Event_Budget!A1:H1", [HEADER]);
  await writeRange("Event_Budget!A2:H10", rows);
  console.log(`   ✅ ${rows.length} budget items seeded`);
}

async function seedEventTimeline(eventIds: string[]) {
  console.log("📊 Seeding Event_Timeline...");
  const HEADER = ["ID", "Event ID", "Phase", "Milestone", "Due Date", "Completed", "Completed Date", "Notes", "Created"];

  const phases = [
    ["Planning", "Event concept approved", true],
    ["Planning", "Venue booked", true],
    ["Pre-event", "Sponsor contracts signed", true],
    ["Pre-event", "Tenant registration opened", true],
    ["Pre-event", "Marketing campaign launch", false],
    ["Pre-event", "All tenant payments collected", false],
    ["Event", "Setup & booth installation", false],
    ["Event", "Event day execution", false],
    ["Post-event", "Financial reconciliation", false],
    ["Post-event", "Thank you notes to sponsors", false],
  ];

  const rows: (string | number | boolean)[][] = [];
  for (let i = 0; i < phases.length; i++) {
    const eventId = eventIds[0] || "evt-fragrantions-2026";
    const completed = phases[i][2] ? "Yes" : "No";
    rows.push([
      `TL-${String(i + 1).padStart(3, "0")}`,
      eventId,
      phases[i][0],
      phases[i][1],
      addDaysToEvent(1),
      completed,
      completed ? addDaysToEvent(1) : "",
      "Seed data — timeline Fragrantions",
      fmtDate(today),
    ]);
  }

  await writeRange("Event_Timeline!A1:I1", [HEADER]);
  await writeRange("Event_Timeline!A2:I11", rows);
  console.log(`   ✅ ${rows.length} timeline items seeded`);
}

function addDaysToEvent(dayOffset: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  return fmtDate(d);
}

async function main() {
  console.log("🚀 Starting Event Commercial Pipeline seed...\n");

  const eventIds = await getEventIds();
  console.log(`📋 Found ${eventIds.length} events: ${eventIds.slice(0, 3).join(", ")}\n`);

  await seedEventTenants(eventIds);
  await seedEventSponsors(eventIds);
  await seedEventBudget(eventIds);
  await seedEventTimeline(eventIds);

  console.log("\n✅ Event Commercial Pipeline seed complete!");
  console.log("📝 Next: run the events API to verify, then commit & deploy.");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
