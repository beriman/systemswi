export type StatusTone = "ready" | "build" | "plan" | "risk";

export interface HoldingDivision {
  name: string;
  summary: string;
  focus: string[];
  readiness: number;
  status: string;
  tone: StatusTone;
}

export interface Workstream {
  name: string;
  status: string;
  tone: StatusTone;
  progress: number;
  owner: string;
  nextStep: string;
}

export const holdingDivisions: HoldingDivision[] = [
  {
    name: "Holding Office",
    summary: "Legal, finance, accounting, corporate strategy, governance, partner, vendor, and investor room.",
    focus: ["Legal company documents", "Finance control", "Investor readiness"],
    readiness: 45,
    status: "Core office setup",
    tone: "build",
  },
  {
    name: "SWI Store & Offline Experience",
    summary: "Retail store, kelas parfum, racik parfum, AI Mix, booking flow, and customer feedback loop.",
    focus: ["Store SOP", "15-minute flexible booking", "Customer experience"],
    readiness: 55,
    status: "Operating model",
    tone: "build",
  },
  {
    name: "Event Organizer / Fragrantions",
    summary: "Road to Fragrantions, Fragrantions Expo, sponsor, tenant, ticketing, media, and activation.",
    focus: ["Sponsor deck", "Vendor map", "Event budget"],
    readiness: 38,
    status: "Pipeline event",
    tone: "plan",
  },
  {
    name: "Production & Brands",
    summary: "Brand portfolio, R&D, formula, materials, packaging, production planning, pricing, and QC.",
    focus: ["SKU map", "COGS and margin", "Quality control"],
    readiness: 48,
    status: "Brand portfolio",
    tone: "build",
  },
  {
    name: "WEB sensasiwangi.id Marketplace",
    summary: "Product catalog, booking, checkout, order operations, customer support, SEO, analytics, and growth.",
    focus: ["Catalog", "Booking and checkout", "Growth analytics"],
    readiness: 32,
    status: "Marketplace build",
    tone: "plan",
  },
  {
    name: "Digital Systems & AI",
    summary: "AppSheet, Google AI Studio, customer scent profile, automation, CRM, and data dashboard.",
    focus: ["Single source of data", "AI Mix profile", "Automation"],
    readiness: 42,
    status: "System foundation",
    tone: "build",
  },
];

export const workstreams: Workstream[] = [
  {
    name: "Operasional holding",
    status: "Sedang jalan",
    tone: "build",
    progress: 45,
    owner: "Direksi / Holding Office",
    nextStep: "Tetapkan meeting cadence, PIC lintas divisi, dan format laporan mingguan.",
  },
  {
    name: "SWI Store",
    status: "Sedang jalan",
    tone: "build",
    progress: 55,
    owner: "Store Manager",
    nextStep: "Finalisasi SOP booking, AI Mix, arrival 15 menit, cleanup 15 menit, dan feedback customer.",
  },
  {
    name: "Event Organizer / Fragrantions",
    status: "Butuh rencana event",
    tone: "plan",
    progress: 38,
    owner: "Event Lead",
    nextStep: "Lengkapi sponsor deck, tenant package, vendor list, timeline produksi, dan budget event.",
  },
  {
    name: "Production & Brands",
    status: "Portfolio berjalan",
    tone: "build",
    progress: 48,
    owner: "Brand / Production Lead",
    nextStep: "Rapikan SKU, formula, bahan, packaging, batch, stok, COGS, margin, dan QC.",
  },
  {
    name: "WEB marketplace sensasiwangi.id",
    status: "Butuh roadmap",
    tone: "plan",
    progress: 32,
    owner: "Digital / WEB Lead",
    nextStep: "Prioritaskan katalog, booking, checkout, order ops, SEO, analytics, dan customer support.",
  },
  {
    name: "Monitoring keuangan",
    status: "Butuh data aktual",
    tone: "risk",
    progress: 40,
    owner: "Finance",
    nextStep: "Isi kas, omzet, COGS, OPEX, CAPEX, hutang/piutang, dan runway.",
  },
  {
    name: "Legal, HKI, dan merek",
    status: "Perlu audit",
    tone: "risk",
    progress: 35,
    owner: "Legal / Direksi",
    nextStep: "Inventaris akta, NIB, NPWP, kontrak, izin, serta status merek SWI dan brand.",
  },
  {
    name: "Partner, vendor, investor readiness",
    status: "Butuh paket data room",
    tone: "plan",
    progress: 45,
    owner: "Direksi / Business Development",
    nextStep: "Satukan deck, financial model, partner list, vendor due diligence, dan investor room.",
  },
];

export const financeAssumptions = [
  { label: "CAPEX pengembangan awal", value: "Rp 300-500 juta", note: "Perlu dirinci menjadi RAB per divisi." },
  { label: "OPEX bulanan", value: "Rp 45-80 juta", note: "Validasi dengan payroll, sewa, bahan, marketing, dan sistem." },
  { label: "Omzet potensial bulanan", value: "Rp 60-120 juta", note: "Pisahkan store, event, brand, marketplace, dan B2B." },
  { label: "Payback target", value: "18-30 bulan", note: "Butuh validasi dari unit economics aktual." },
  { label: "Revenue share awal", value: "10%", note: "Khusus konteks kerja sama TIM, perlu kontrak final." },
];

export const investorReadiness = [
  {
    title: "Narrative",
    items: ["Company profile", "Holding structure", "Market opportunity", "Business unit synergy"],
  },
  {
    title: "Numbers",
    items: ["Historical sales", "CAPEX and OPEX", "Unit economics", "Use of funds"],
  },
  {
    title: "Proof",
    items: ["Store traction", "Event documentation", "Product catalog", "Curated testimonials"],
  },
  {
    title: "Governance",
    items: ["Legal documents", "HKI / merek", "Contracts", "Monthly reporting cadence"],
  },
];

export const publicHighlights = [
  {
    label: "Experience-led commerce",
    copy: "Store, kelas, dan event membuat customer mencoba langsung sebelum masuk ke repeat order digital.",
  },
  {
    label: "Brand and production engine",
    copy: "Portfolio brand memberi ruang variasi positioning, harga, distribusi, dan B2B production.",
  },
  {
    label: "Marketplace and customer data",
    copy: "sensasiwangi.id dapat menjadi pusat katalog, booking, checkout, scent profile, dan CRM.",
  },
];
