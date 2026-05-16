export type StatusTone = "ready" | "build" | "plan" | "risk";

export interface HoldingDivision {
  code: string;
  name: string;
  headline: string;
  summary: string;
  focus: string[];
  metrics: string[];
  readiness: number;
  status: string;
  tone: StatusTone;
  nextDecision: string;
  revenueLever: string;
}

export interface Workstream {
  name: string;
  status: string;
  tone: StatusTone;
  progress: number;
  owner: string;
  nextStep: string;
  decisionNeeded: string;
  evidence: string;
}

export interface TimelineItem {
  period: string;
  title: string;
  status: string;
  tone: StatusTone;
  items: string[];
}

export const executiveStats = [
  {
    label: "Business pillars",
    value: "3",
    note: "Event & Experience, Digital Platform, Production & Brands",
  },
  {
    label: "Brand portfolio",
    value: "3",
    note: "Larc-en-Scent, Pixel Potion, NUScentZa",
  },
  {
    label: "2026 focus products",
    value: "2",
    note: "NUScentZa 1L dan Pixel Potion Rosa 1L",
  },
  {
    label: "Investor workstreams",
    value: "8",
    note: "Finance, legal, HKI, partner, vendor, data room",
  },
];

export const rupsSnapshot = {
  date: "11 Januari 2026",
  agenda: "Rekap tahun 2025 dan perencanaan tahun 2026",
  facts: [
    "NUScentZa: penjualan 2025 belum besar dan perlu strategi pemasaran lebih agresif.",
    "Pixel Potion: beberapa penjualan sudah ada, tetapi awareness perlu ditingkatkan.",
    "Larc-en-Scent: belum merilis produk; podcast berjalan aktif sebagai mesin branding.",
    "Fokus 2026: produksi, event parfum nasional, dan produk ukuran 1 liter untuk reseller.",
  ],
};

export const holdingDivisions: HoldingDivision[] = [
  {
    code: "HLD",
    name: "Holding Office",
    headline: "Control tower untuk legal, finance, governance, dan investor room.",
    summary:
      "Mengikat semua unit SWI ke ritme rapat, laporan, data room, dokumen legal, kontrak, dan kontrol keuangan.",
    focus: ["RUPS & governance", "Finance control", "Legal, HKI, kontrak", "Investor data room"],
    metrics: ["Runway", "OPEX", "status HKI", "kelengkapan data room"],
    readiness: 46,
    status: "Build",
    tone: "build",
    nextDecision: "Tetapkan format laporan mingguan holding dan owner tiap workstream.",
    revenueLever: "Mempercepat fundraising, partnership, dan keputusan lintas unit.",
  },
  {
    code: "STR",
    name: "SWI Store & Offline Experience",
    headline: "Tempat customer mencoba, belajar, booking, dan masuk ke repeat order.",
    summary:
      "Retail, kelas parfum, racik parfum, AI Mix, booking 15 menit, SOP kunjungan, feedback, dan testimonial terkurasi.",
    focus: ["Retail experience", "Kelas & workshop", "Booking flow", "Customer feedback"],
    metrics: ["booking conversion", "seat utilization", "AOV", "repeat order"],
    readiness: 58,
    status: "Build",
    tone: "build",
    nextDecision: "Rapikan paket kelas, price list, dan alur customer dari QR sampai checkout.",
    revenueLever: "Cashflow harian dari kelas, racik parfum, retail, dan upsell produk.",
  },
  {
    code: "EVT",
    name: "Event Organizer / Fragrantions",
    headline: "Growth engine untuk komunitas, sponsor, tenant, media, dan leads.",
    summary:
      "Road to Fragrantions, event utama Fragrantions, webinar, booth, tenant package, sponsor deck, dan post-event reporting.",
    focus: ["Sponsor deck", "Tenant package", "Vendor & venue", "Ticketing & media"],
    metrics: ["tenant pipeline", "sponsor value", "ticket sales", "lead capture"],
    readiness: 39,
    status: "Planning",
    tone: "plan",
    nextDecision: "Putuskan format Road to Fragrantions, kota prioritas, dan budget event.",
    revenueLever: "Sponsor, booth tenant, ticketing, workshop, merchandise, dan partner activation.",
  },
  {
    code: "PRD",
    name: "Production & Brands",
    headline: "Mesin SKU, formula, batch, QC, margin, dan brand incubation.",
    summary:
      "Mengelola Larc-en-Scent, Pixel Potion, NUScentZa, R&D, formula, sourcing, packaging, stok, COGS, dan QC.",
    focus: ["SKU & formula", "1 liter product line", "COGS & margin", "QC & batch"],
    metrics: ["units sold", "gross margin", "stock turn", "batch readiness"],
    readiness: 49,
    status: "Build",
    tone: "build",
    nextDecision: "Finalisasi formula dan harga reseller NUScentZa 1L serta Pixel Potion Rosa 1L.",
    revenueLever: "Produk milik sendiri, reseller, custom formulation, dan B2B production.",
  },
  {
    code: "WEB",
    name: "WEB Marketplace sensasiwangi.id",
    headline: "Katalog, booking, checkout, CRM, dan customer data dalam satu kanal.",
    summary:
      "Marketplace sebagai pusat traffic digital untuk produk, brand pages, event registration, booking store, payment, dan analytics.",
    focus: ["Catalog & brand page", "Booking & checkout", "CRM", "SEO & analytics"],
    metrics: ["traffic source", "conversion", "cart value", "repeat order"],
    readiness: 34,
    status: "Planning",
    tone: "plan",
    nextDecision: "Pilih prioritas MVP: katalog brand, booking store, atau registration event.",
    revenueLever: "Repeat order, digital sales, marketplace margin, dan customer database.",
  },
  {
    code: "SYS",
    name: "Digital Systems & AI",
    headline: "Sistem kerja untuk menyambungkan Google, AI, finance, dan dashboard.",
    summary:
      "Automation, Google Drive, AppSheet, AI Mix, reporting, workflow, dan single source of truth untuk semua unit.",
    focus: ["AI Mix profile", "Automation", "Reporting", "Document control"],
    metrics: ["data completeness", "task SLA", "report cadence", "automation coverage"],
    readiness: 43,
    status: "Build",
    tone: "build",
    nextDecision: "Tentukan sumber data utama untuk finance, event, brand, dan customer.",
    revenueLever: "Efisiensi operasional dan keputusan yang lebih cepat dari data aktual.",
  },
];

export const ecosystemFlow = [
  {
    step: "Acquire",
    title: "Event, konten, QR, partner, store visit",
    copy: "Customer dan partner masuk lewat Fragrantions, Road to Fragrantions, podcast, landing page, QR, atau kunjungan toko.",
  },
  {
    step: "Experience",
    title: "SWI Store, workshop, AI Mix, racik parfum",
    copy: "Pengalaman offline membuat customer memahami aroma, mencoba produk, dan memberi data preferensi.",
  },
  {
    step: "Convert",
    title: "Marketplace, booking, checkout, B2B inquiry",
    copy: "Traffic diarahkan ke katalog, booking kelas, event registration, checkout produk, dan inquiry partner.",
  },
  {
    step: "Retain",
    title: "CRM, repeat order, reseller, brand launch",
    copy: "Scent profile dan feedback menjadi dasar rekomendasi, repeat order, reseller, dan pengembangan SKU.",
  },
];

export const publicHighlights = [
  {
    label: "Experience-led commerce",
    copy: "Store, kelas, dan event membuat fragrance lebih mudah dijual karena customer mengalami prosesnya dulu.",
  },
  {
    label: "Multi-brand portfolio",
    copy: "Larc-en-Scent, Pixel Potion, dan NUScentZa memberi pilihan positioning premium, pop culture, dan heritage.",
  },
  {
    label: "Investor-readable holding",
    copy: "SWI bisa dibaca sebagai jaringan revenue stream: store, event, produk, B2B, marketplace, dan data.",
  },
];

export const brandArchitecture = [
  {
    name: "Larc-en-Scent",
    position: "Premium artisan perfumery",
    audience: "Collector, niche fragrance buyer, premium gifting",
    proof: "Podcast aktif pada 2025 sebagai mesin branding.",
    nextMove: "Siapkan hero product, foto produk, dan launch story yang kredibel.",
    tone: "build" as StatusTone,
  },
  {
    name: "Pixel Potion",
    position: "Energetic pop culture fragrance",
    audience: "Gamer, youth, fandom, event-goers",
    proof: "Beberapa penjualan 2025; awareness perlu diperbesar.",
    nextMove: "Scale Pixel Potion 1 Liter Rosa untuk reseller dan event activation.",
    tone: "ready" as StatusTone,
  },
  {
    name: "NUScentZa",
    position: "Indonesian heritage scent",
    audience: "Affordable daily scent, reseller, city and heritage collection",
    proof: "Penjualan 2025 belum besar; butuh agresivitas marketing.",
    nextMove: "Finalisasi NUScentZa 1 Liter, sourcing botol, label, harga, dan margin.",
    tone: "plan" as StatusTone,
  },
];

export const productRoadmap = [
  {
    name: "NUScentZa 1 Liter",
    brand: "NUScentZa",
    target: "Ukuran besar untuk reseller",
    phase: "Q1 formula, bottle, label, price; Q2 first batch",
    blockers: ["Finalisasi formula batch besar", "Sourcing botol 1 liter", "Kalkulasi harga dan margin"],
    tone: "plan" as StatusTone,
  },
  {
    name: "Pixel Potion 1 Liter Rosa",
    brand: "Pixel Potion",
    target: "Parfum karakter Rosa untuk reseller dan activation",
    phase: "Q1 scaling review; Q2 first batch",
    blockers: ["Review formula Rosa", "Sourcing botol premium 1 liter", "Packaging 1L edition"],
    tone: "build" as StatusTone,
  },
  {
    name: "Larc-en-Scent launch product",
    brand: "Larc-en-Scent",
    target: "Produk premium setelah pondasi branding podcast",
    phase: "Story, formula, hero visual, launch plan",
    blockers: ["Hero SKU", "Brand story", "Foto produk", "Harga premium"],
    tone: "risk" as StatusTone,
  },
];

export const eventPipeline = [
  {
    name: "Road to Fragrantions 2026",
    period: "Q1 2026",
    location: "Multi-city / format final TBD",
    status: "Planning",
    tone: "plan" as StatusTone,
    commercial: "Lead capture, community, sponsor warm-up, tenant prospecting",
    next: "Riset timeline, booth design, marketing materials, kota prioritas.",
  },
  {
    name: "Fragrantions 2026",
    period: "Q2 2026",
    location: "Event utama / venue final TBD",
    status: "Planning",
    tone: "plan" as StatusTone,
    commercial: "Sponsor, booth tenant, ticketing, workshop, media package",
    next: "Booth setup, display produk, promotional materials, staff training.",
  },
  {
    name: "Basic Perfumery Workshop",
    period: "Always-on",
    location: "Lab Bintaro / SWI Store",
    status: "Packageable",
    tone: "build" as StatusTone,
    commercial: "Ticketed class, starter kit, upsell produk, customer profile",
    next: "Tetapkan kalender kelas, kapasitas, price, SOP, dan testimonial.",
  },
  {
    name: "Corporate Scent Branding",
    period: "Pipeline B2B",
    location: "Jakarta & corporate client",
    status: "Opportunity",
    tone: "build" as StatusTone,
    commercial: "Custom formulation, brand activation, retainer production",
    next: "Susun case deck, package price, dan scope deliverables.",
  },
];

export const quarterlyRoadmap: TimelineItem[] = [
  {
    period: "Q1 2026",
    title: "Foundation sprint",
    status: "Planning",
    tone: "plan",
    items: [
      "Road to Fragrantions: riset timeline, booth design, marketing materials.",
      "NUScentZa 1L: formula batch besar, botol, margin, label.",
      "Pixel Potion Rosa 1L: scaling formula, botol premium, packaging, harga reseller.",
    ],
  },
  {
    period: "Q2 2026",
    title: "Launch and event readiness",
    status: "Execution needed",
    tone: "build",
    items: [
      "Fragrantions 2026: booth setup, product display, promo materials, staff training.",
      "Produksi batch pertama NUScentZa 1L.",
      "Produksi batch pertama Pixel Potion Rosa 1L.",
    ],
  },
  {
    period: "Q3-Q4 2026",
    title: "Evaluation and scale",
    status: "Future",
    tone: "ready",
    items: [
      "Evaluasi penjualan produk 1 liter.",
      "Ekspansi varian produk 1 liter jika berhasil.",
      "Planning 2027 berdasarkan data penjualan, event, dan reseller.",
    ],
  },
];

export const kpiTracker = [
  { metric: "NUScentZa 1L Units Sold", target: "TBD", current: "0", status: "Belum dimulai" },
  { metric: "Pixel Potion 1L Units Sold", target: "TBD", current: "0", status: "Belum dimulai" },
  { metric: "Event Participation", target: "2", current: "0", status: "Planning" },
];

export const workstreams: Workstream[] = [
  {
    name: "Operasional holding",
    status: "Perlu cadence",
    tone: "build",
    progress: 46,
    owner: "Direksi / Holding Office",
    nextStep: "Tentukan meeting cadence, format laporan mingguan, dan PIC per unit.",
    decisionNeeded: "Format control tower SWI",
    evidence: "RUPS dan task tracker sudah ada, perlu dijadikan operating rhythm.",
  },
  {
    name: "SWI Store",
    status: "Model berjalan",
    tone: "build",
    progress: 58,
    owner: "Store Manager",
    nextStep: "Finalisasi paket kelas, booking, AI Mix, arrival 15 menit, cleanup 15 menit, feedback.",
    decisionNeeded: "Paket yang dijual dan harga",
    evidence: "Store menjadi jembatan experience, kelas, dan repeat order.",
  },
  {
    name: "Event Organizer / Fragrantions",
    status: "Planning",
    tone: "plan",
    progress: 39,
    owner: "Event Lead",
    nextStep: "Susun sponsor deck, tenant package, vendor list, timeline, budget, dan kota roadshow.",
    decisionNeeded: "Event format dan budget",
    evidence: "RUPS 2026 menetapkan Road to Fragrantions dan Fragrantions sebagai fokus.",
  },
  {
    name: "Production & Brands",
    status: "Produk 1L direncanakan",
    tone: "build",
    progress: 49,
    owner: "Brand / Production Lead",
    nextStep: "Finalisasi formula, botol, packaging, margin, batch, stok, dan QC untuk produk 1L.",
    decisionNeeded: "Harga reseller dan MOQ",
    evidence: "NUScentZa 1L dan Pixel Potion Rosa 1L masuk task tracker 2026.",
  },
  {
    name: "WEB marketplace sensasiwangi.id",
    status: "Butuh MVP",
    tone: "plan",
    progress: 34,
    owner: "Digital / WEB Lead",
    nextStep: "Pilih MVP katalog brand, booking store, event registration, atau checkout produk.",
    decisionNeeded: "Prioritas MVP",
    evidence: "Public pages sudah ada; perlu diarahkan menjadi commerce funnel.",
  },
  {
    name: "Monitoring keuangan",
    status: "Angka aktual belum lengkap",
    tone: "risk",
    progress: 40,
    owner: "Finance",
    nextStep: "Isi kas, omzet, COGS, OPEX, CAPEX, hutang/piutang, runway, dan margin SKU.",
    decisionNeeded: "Template laporan finance",
    evidence: "Asumsi CAPEX/OPEX sudah ada, perlu validasi terhadap transaksi aktual.",
  },
  {
    name: "Legal, HKI, dan merek",
    status: "Perlu audit",
    tone: "risk",
    progress: 35,
    owner: "Legal / Direksi",
    nextStep: "Inventaris akta, NIB, NPWP, kontrak, izin, status merek SWI dan brand.",
    decisionNeeded: "Daftar dokumen wajib",
    evidence: "Investor readiness bergantung pada legal pack dan status merek.",
  },
  {
    name: "Partner, vendor, investor readiness",
    status: "Data room belum lengkap",
    tone: "plan",
    progress: 45,
    owner: "Direksi / Business Development",
    nextStep: "Satukan deck, financial model, partner list, vendor due diligence, dan proof of traction.",
    decisionNeeded: "Struktur investor room",
    evidence: "Company profile dan dashboard harus menjadi bahan bicara investor.",
  },
];

export const financeAssumptions = [
  { label: "CAPEX pengembangan awal", value: "Rp 300-500 juta", note: "Perlu dipecah menjadi RAB store, produksi, event, marketplace, dan sistem." },
  { label: "OPEX bulanan", value: "Rp 45-80 juta", note: "Validasi payroll, sewa, bahan baku, marketing, event prep, software, dan logistik." },
  { label: "Omzet potensial bulanan", value: "Rp 60-120 juta", note: "Pisahkan store, kelas, produk brand, B2B, marketplace, dan event." },
  { label: "Payback target", value: "18-30 bulan", note: "Butuh unit economics aktual dan asumsi growth yang defensible." },
  { label: "Revenue share awal", value: "10%", note: "Khusus konteks kerja sama TIM, perlu kontrak final dan waterfall yang jelas." },
];

export const investorReadiness = [
  {
    title: "Narrative",
    score: 68,
    items: ["Company profile", "Holding structure", "Market opportunity", "Business unit synergy"],
  },
  {
    title: "Numbers",
    score: 38,
    items: ["Historical sales", "CAPEX and OPEX", "Unit economics", "Use of funds"],
  },
  {
    title: "Proof",
    score: 42,
    items: ["Store traction", "Event documentation", "Product catalog", "Curated testimonials"],
  },
  {
    title: "Governance",
    score: 35,
    items: ["Legal documents", "HKI / merek", "Contracts", "Monthly reporting cadence"],
  },
];

export const investorThesis = [
  {
    title: "Commerce starts from experience",
    copy: "Fragrance sulit dijual hanya sebagai katalog. SWI punya peluang mengubah discovery menjadi kelas, event, store visit, dan repeat order.",
  },
  {
    title: "Event creates a category platform",
    copy: "Fragrantions dapat menjadi tempat sponsor, tenant, brand, media, perfumer, dan customer bertemu dalam satu kalender komersial.",
  },
  {
    title: "Owned brands lift margin",
    copy: "Brand portfolio memungkinkan SWI tidak hanya menjadi channel, tetapi juga pemilik produk dengan margin dan positioning sendiri.",
  },
  {
    title: "Customer data compounds",
    copy: "AI Mix, booking, marketplace, dan CRM memberi data preferensi aroma yang bisa dipakai untuk rekomendasi dan product development.",
  },
];

export const boardPriorities = [
  "Putuskan MVP marketplace: katalog, booking, checkout, atau event registration.",
  "Selesaikan product brief NUScentZa 1L dan Pixel Potion Rosa 1L.",
  "Buat sponsor deck dan tenant package Fragrantions 2026.",
  "Lengkapi finance actual: kas, omzet, COGS, OPEX, CAPEX, runway.",
  "Audit legal/HKI/merek dan pisahkan dokumen publik vs data room investor.",
];

export const riskRegister = [
  {
    risk: "Angka finansial belum cukup defensible untuk investor.",
    mitigation: "Bangun monthly finance pack: P&L, cashflow, unit economics, SKU margin, dan event budget.",
    tone: "risk" as StatusTone,
  },
  {
    risk: "Event membutuhkan cash sebelum revenue sponsor/tenant masuk.",
    mitigation: "Gunakan gated plan: LOI sponsor, tenant deposit, venue hold, lalu production spend.",
    tone: "plan" as StatusTone,
  },
  {
    risk: "Brand portfolio terlalu banyak tanpa hero SKU.",
    mitigation: "Prioritaskan 2 SKU 1L dan 1 hero premium launch; sisanya masuk backlog.",
    tone: "build" as StatusTone,
  },
  {
    risk: "Marketplace bisa melebar sebelum operasional siap.",
    mitigation: "Mulai dari funnel paling dekat revenue: booking, katalog brand, atau registration event.",
    tone: "build" as StatusTone,
  },
];

export const dataRoomChecklist = [
  "Akta, NIB, NPWP, rekening, struktur pemegang saham",
  "Status merek SWI, Larc-en-Scent, Pixel Potion, NUScentZa",
  "Deck company profile dan investor memo",
  "CAPEX, OPEX, use of funds, projection, scenario model",
  "Event deck: sponsor, tenant, vendor, budget, timeline",
  "Produk: SKU, formula status, COGS, margin, stok, supplier",
  "Traction: sales, event proof, customer leads, testimonials",
  "Partner/vendor list dan kontrak penting",
];
