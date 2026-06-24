// Sukuk Local Data Store — fallback when Google Sheets auth fails
// Auto-generated seed data for Sukuk Full Suite
// Google Sheets token expired — using local data as primary source until re-authenticated

export const SUKUK_LOCAL_DATA = {
  investors: [
    {"id":"INV-001","nama":"PT Mandiri Sejahtera","email":"finance@mandiri-sejahtera.co.id","telepon":"021-5551234","alamat":"Jl. Sudirman No. 45, Jakarta","npwp":"01.234.567.8-001.000","bank":"BCA","no_rekening":"1234567890","saldo_investasi":50000000,"total_profit":1250000,"status":"aktif","consent":"1","tanggal_daftar":"2025-01-15","catatan":"Investor strategis batch 1"},
    {"id":"INV-002","nama":"CV Berkah Wangi","email":"info@berkahwangi.id","telepon":"021-5552345","alamat":"Jl. Gatot Subroto No. 12, Bandung","npwp":"02.345.678.9-002.000","bank":"Mandiri","no_rekening":"9876543210","saldo_investasi":30000000,"total_profit":750000,"status":"aktif","consent":"1","tanggal_daftar":"2025-02-20","catatan":"Mitra distributor"},
    {"id":"INV-003","nama":"Tn. Ahmad Fauzi","email":"ahmad.fauzi@email.com","telepon":"0812-3456-7890","alamat":"Jl. Merdeka No. 8, Surabaya","npwp":"03.456.789.0-003.000","bank":"BNI","no_rekening":"1122334455","saldo_investasi":15000000,"total_profit":375000,"status":"aktif","consent":"1","tanggal_daftar":"2025-03-10","catatan":"Investor individu"},
    {"id":"INV-004","nama":"PT Parfum Nusantara","email":"invest@parfumnusantara.co.id","telepon":"021-5553456","alamat":"Jl. Thamrin No. 22, Jakarta","npwp":"04.567.890.1-004.000","bank":"BRI","no_rekening":"5566778899","saldo_investasi":75000000,"total_profit":1875000,"status":"aktif","consent":"1","tanggal_daftar":"2025-04-05","catatan":"Investor korporat"},
    {"id":"INV-005","nama":"Yayasan Wangi Abadi","email":"admin@wangiabadi.org","telepon":"021-5554567","alamat":"Jl. Kuningan No. 17, Jakarta","npwp":"05.678.901.2-005.000","bank":"BCA","no_rekening":"9988776655","saldo_investasi":25000000,"total_profit":625000,"status":"aktif","consent":"1","tanggal_daftar":"2025-05-12","catatan":"Yayasan sosial"}
  ],
  creditors: [
    {"id":"CRD-001","nama":"Bank Syariah Mandiri","email":"corporate@bsm.co.id","telepon":"021-5556789","alamat":"Jl. MH Thamrin No. 5, Jakarta","npwp":"01.111.222.3-006.000","bank":"BSM","no_rekening":"1001234567","tipe":"Bank","plafon":500000000,"saldo_pinjaman":200000000,"tenor_bulan":24,"bunga_persen":8.5,"status":"aktif","tanggal_akad":"2024-06-01","catatan":"Kreditur utama sukuk"},
    {"id":"CRD-002","nama":"PT Pembiayaan Syariah","email":"info@pembiayaansyariah.co.id","telepon":"021-5557890","alamat":"Jl. Sudirman No. 88, Jakarta","npwp":"02.222.333.4-007.000","bank":"BRI Syariah","no_rekening":"2001234567","tipe":"Leasing","plafon":300000000,"saldo_pinjaman":150000000,"tenor_bulan":18,"bunga_persen":9.0,"status":"aktif","tanggal_akad":"2024-08-15","catatan":"Pembiayaan infrastruktur"},
    {"id":"CRD-003","nama":"Koperasi Simpan Pinjam","email":"ksp@ksp-wangi.id","telepon":"021-5558901","alamat":"Jl. Asia Afrika No. 33, Bandung","npwp":"03.333.444.5-008.000","bank":"BCA","no_rekening":"3001234567","tipe":"Koperasi","plafon":100000000,"saldo_pinjaman":50000000,"tenor_bulan":12,"bunga_persen":7.5,"status":"aktif","tanggal_akad":"2024-10-20","catatan":"Koperasi karyawan SWI"}
  ],
  products: [
    {"id":1,"kode":"SM-001","nama":"Sukuk Wangi Parfum A","deskripsi":"Sukuk mikro untuk produksi parfum Wangi A — 1000 unit","kategori":"merchandise","modal_dibutuhkan":50000000,"target_investor":1000,"nisbah":"60:40","status":"open","pic_produk":"Budi Santoso","tanggal_launch":"2025-01-01"},
    {"id":2,"kode":"SM-002","nama":"Sukuk Wangi Parfum B","deskripsi":"Sukuk mikro untuk ekspansi produk Wangi B — 500 unit","kategori":"produk","modal_dibutuhkan":75000000,"target_investor":500,"nisbah":"55:45","status":"open","pic_produk":"Siti Rahayu","tanggal_launch":"2025-02-01"},
    {"id":3,"kode":"SM-003","nama":"Sukuk Experience Store","deskripsi":"Pendirian experience store di 3 kota besar","kategori":"experience","modal_dibutuhkan":100000000,"target_investor":200,"nisbah":"65:35","status":"open","pic_produk":"Andi Wijaya","tanggal_launch":"2025-03-01"},
    {"id":4,"kode":"SM-004","nama":"Sukuk Bahan Baku","deskripsi":"Pembelian bahan baku premium untuk Q2-Q3","kategori":"merchandise","modal_dibutuhkan":30000000,"target_investor":300,"nisbah":"50:50","status":"funded","pic_produk":"Dewi Lestari","tanggal_launch":"2025-04-01"},
    {"id":5,"kode":"SM-005","nama":"Sukuk Digital Marketing","deskripsi":"Kampanye digital marketing parfum SWI","kategori":"produk","modal_dibutuhkan":20000000,"target_investor":400,"nisbah":"60:40","status":"open","pic_produk":"Rina Putri","tanggal_launch":"2025-05-01"}
  ],
  investments: [
    {"id":1,"product_id":1,"product_name":"Sukuk Wangi Parfum A","product_code":"SM-001","investor_name":"PT Mandiri Sejahtera","investor_email":"finance@mandiri-sejahtera.co.id","investor_phone":"021-5551234","jumlah_unit":500,"nilai_investasi":25000000,"tanggal_investasi":"2025-01-20","status":"active","consent":1},
    {"id":2,"product_id":1,"product_name":"Sukuk Wangi Parfum A","product_code":"SM-001","investor_name":"CV Berkah Wangi","investor_email":"info@berkahwangi.id","investor_phone":"021-5552345","jumlah_unit":300,"nilai_investasi":15000000,"tanggal_investasi":"2025-02-15","status":"active","consent":1},
    {"id":3,"product_id":2,"product_name":"Sukuk Wangi Parfum B","product_code":"SM-002","investor_name":"Tn. Ahmad Fauzi","investor_email":"ahmad.fauzi@email.com","investor_phone":"0812-3456-7890","jumlah_unit":100,"nilai_investasi":15000000,"tanggal_investasi":"2025-03-05","status":"active","consent":1},
    {"id":4,"product_id":3,"product_name":"Sukuk Experience Store","product_code":"SM-003","investor_name":"PT Parfum Nusantara","investor_email":"invest@parfumnusantara.co.id","investor_phone":"021-5553456","jumlah_unit":100,"nilai_investasi":50000000,"tanggal_investasi":"2025-03-20","status":"active","consent":1},
    {"id":5,"product_id":4,"product_name":"Sukuk Bahan Baku","product_code":"SM-004","investor_name":"Yayasan Wangi Abadi","investor_email":"admin@wangiabadi.org","investor_phone":"021-5554567","jumlah_unit":200,"nilai_investasi":20000000,"tanggal_investasi":"2025-04-10","status":"active","consent":1}
  ],
  distributions: [
    {"id":1,"product_id":1,"product_name":"Sukuk Wangi Parfum A","product_code":"SM-001","periode":"Q1 2025","total_revenue":35000000,"total_cogs":20000000,"total_profit":15000000,"nisbah_investor":60,"nisbah_pengelola":40,"jumlah_dibagikan":9000000,"jumlah_per_unit":18000,"status":"paid"},
    {"id":2,"product_id":2,"product_name":"Sukuk Wangi Parfum B","product_code":"SM-002","periode":"Q1 2025","total_revenue":22500000,"total_cogs":15000000,"total_profit":7500000,"nisbah_investor":55,"nisbah_pengelola":45,"jumlah_dibagikan":4125000,"jumlah_per_unit":41250,"status":"paid"},
    {"id":3,"product_id":4,"product_name":"Sukuk Bahan Baku","product_code":"SM-004","periode":"Q2 2025","total_revenue":18000000,"total_cogs":12000000,"total_profit":6000000,"nisbah_investor":50,"nisbah_pengelola":50,"jumlah_dibagikan":3000000,"jumlah_per_unit":30000,"status":"scheduled"}
  ],
  rab: [
    {"id":"RAB-001","kategori":"Produksi","deskripsi":"Bahan baku parfum Wangi A","volume":1000,"satuan":"kg","harga_satuan":50000,"jumlah":50000000,"realisasi":48000000,"variance":2000000,"status":"approved","catatan":"Bahan baku premium dari supplier lokal"},
    {"id":"RAB-002","kategori":"Operasional","deskripsi":"Biaya produksi dan QC","volume":1,"satuan":"lot","harga_satuan":25000000,"jumlah":25000000,"realisasi":23500000,"variance":1500000,"status":"approved","catatan":"Termasuk QC dan packaging"},
    {"id":"RAB-003","kategori":"Marketing","deskripsi":"Kampanye pemasaran Q2","volume":1,"satuan":"kampanye","harga_satuan":15000000,"jumlah":15000000,"realisasi":12000000,"variance":3000000,"status":"approved","catatan":"Digital marketing + influencer"}
  ],
  schedule: [
    {"id":"SCH-001","product_id":"SM-001","product_name":"Sukuk Wangi Parfum A","periode":"1","tanggal_jatuh_tempo":"2025-07-20","jumlah_pokok":10000000,"jumlah_bagi_hasil":500000,"total_bayar":10500000,"status":"scheduled","tanggal_bayar":"","catatan":"Pembayaran periode 1"},
    {"id":"SCH-002","product_id":"SM-001","product_name":"Sukuk Wangi Parfum A","periode":"2","tanggal_jatuh_tempo":"2025-08-20","jumlah_pokok":10000000,"jumlah_bagi_hasil":500000,"total_bayar":10500000,"status":"scheduled","tanggal_bayar":"","catatan":"Pembayaran periode 2"},
    {"id":"SCH-003","product_id":"SM-002","product_name":"Sukuk Wangi Parfum B","periode":"1","tanggal_jatuh_tempo":"2025-08-05","jumlah_pokok":15000000,"jumlah_bagi_hasil":750000,"total_bayar":15750000,"status":"scheduled","tanggal_bayar":"","catatan":"Pembayaran periode 1"},
    {"id":"SCH-004","product_id":"SM-003","product_name":"Sukuk Experience Store","periode":"1","tanggal_jatuh_tempo":"2025-09-20","jumlah_pokok":20000000,"jumlah_bagi_hasil":1000000,"total_bayar":21000000,"status":"scheduled","tanggal_bayar":"","catatan":"Pembayaran periode 1"},
    {"id":"SCH-005","product_id":"SM-004","product_name":"Sukuk Bahan Baku","periode":"1","tanggal_jatuh_tempo":"2025-07-01","jumlah_pokok":6000000,"jumlah_bagi_hasil":300000,"total_bayar":6300000,"status":"paid","tanggal_bayar":"2025-06-28","catatan":"Sudah dibayar"},
    {"id":"SCH-006","product_id":"SM-005","product_name":"Sukuk Digital Marketing","periode":"1","tanggal_jatuh_tempo":"2025-08-20","jumlah_pokok":4000000,"jumlah_bagi_hasil":200000,"total_bayar":4200000,"status":"scheduled","tanggal_bayar":"","catatan":"Pembayaran periode 1"}
  ],
  audit: [
    {"id":"AUD-001","timestamp":"2025-06-14 08:00:00","user":"system","action":"CREATE","entity":"product","entity_id":"SM-001","details":"Produk sukuk Wangi Parfum A dibuat","ip_address":"10.0.0.1"},
    {"id":"AUD-002","timestamp":"2025-06-14 09:30:00","user":"admin","action":"APPROVE","entity":"product","entity_id":"SM-001","details":"Produk disetujui untuk diluncurkan","ip_address":"10.0.0.2"},
    {"id":"AUD-003","timestamp":"2025-06-15 10:15:00","user":"investor","action":"INVEST","entity":"investment","entity_id":"INV-001","details":"Investasi Rp 50.000.000 oleh PT Mandiri Sejahtera","ip_address":"192.168.1.10"},
    {"id":"AUD-004","timestamp":"2025-06-16 14:00:00","user":"system","action":"DISTRIBUTE","entity":"distribution","entity_id":"DIST-001","details":"Distribusi profit periode 1 — Rp 1.250.000","ip_address":"10.0.0.1"},
    {"id":"AUD-005","timestamp":"2025-06-17 11:20:00","user":"admin","action":"UPDATE","entity":"investor","entity_id":"INV-002","details":"Data investor CV Berkah Wangi diperbarui","ip_address":"10.0.0.2"},
    {"id":"AUD-006","timestamp":"2025-06-18 09:45:00","user":"investor","action":"INVEST","entity":"investment","entity_id":"INV-003","details":"Investasi Rp 15.000.000 oleh Tn. Ahmad Fauzi","ip_address":"192.168.1.11"},
    {"id":"AUD-007","timestamp":"2025-06-19 16:00:00","user":"system","action":"NOTIFY","entity":"notification","entity_id":"NOTIF-001","details":"Notifikasi fully funded dikirim ke investor","ip_address":"10.0.0.1"},
    {"id":"AUD-008","timestamp":"2025-06-20 08:30:00","user":"admin","action":"CREATE","entity":"product","entity_id":"SM-002","details":"Produk sukuk Wangi Parfum B dibuat","ip_address":"10.0.0.2"},
    {"id":"AUD-009","timestamp":"2025-06-21 13:00:00","user":"system","action":"SCHEDULE","entity":"payment","entity_id":"SCH-001","details":"Jadwal pembayaran periode 1 dibuat","ip_address":"10.0.0.1"},
    {"id":"AUD-010","timestamp":"2025-06-22 10:00:00","user":"admin","action":"APPROVE","entity":"payment","entity_id":"SCH-005","details":"Pembayaran periode 1 Sukuk Bahan Baku disetujui","ip_address":"10.0.0.2"}
  ],
  notifications: [
    {"id":"NOTIF-001","timestamp":"2025-06-19 16:00:00","tipe":"info","judul":"Produk SM-001 Fully Funded","pesan":"Produk Sukuk Wangi Parfum A telah mencapai target pendanaan 100%","recipient":"all_investors","read_status":"unread","action_url":"/sukuk/products/SM-001"},
    {"id":"NOTIF-002","timestamp":"2025-06-20 09:00:00","tipe":"payment","judul":"Pembayaran Periode 1","pesan":"Pembayaran pokok + bagi hasil periode 1 akan jatuh tempo dalam 7 hari","recipient":"INV-001","read_status":"unread","action_url":"/sukuk/schedule"},
    {"id":"NOTIF-003","timestamp":"2025-06-21 14:00:00","tipe":"profit","judul":"Distribusi Profit","pesan":"Distribusi profit sebesar Rp 1.250.000 telah dikirim ke rekening","recipient":"INV-001","read_status":"read","action_url":"/sukuk/distributions"},
    {"id":"NOTIF-004","timestamp":"2025-06-22 10:00:00","tipe":"new_product","judul":"Produk Baru Tersedia","pesan":"Sukuk Experience Store sekarang terbuka untuk investasi","recipient":"all_investors","read_status":"unread","action_url":"/sukuk/register"},
    {"id":"NOTIF-005","timestamp":"2025-06-23 08:00:00","tipe":"reminder","judul":"Jatuh Tempo Pembayaran","pesan":"Pembayaran periode 2 SM-001 akan jatuh tempo dalam 3 hari","recipient":"INV-001","read_status":"unread","action_url":"/sukuk/schedule"}
  ],
  proyeksi: [
    {"id":"PROY-001","brand":"Wangi Parfum","product_id":"SM-001","product_name":"Sukuk Wangi Parfum A","investasi":50000000,"bagi_hasil_bulanan":1500000,"return_6bulan":9000000,"return_12bulan":18000000,"roi_persen":36,"payback_bulan":3.3,"npv":2500000,"irr":18.5,"status":"aktif","catatan":"Proyeksi konservatif"},
    {"id":"PROY-002","brand":"Wangi Parfum","product_id":"SM-002","product_name":"Sukuk Wangi Parfum B","investasi":75000000,"bagi_hasil_bulanan":2250000,"return_6bulan":13500000,"return_12bulan":27000000,"roi_persen":36,"payback_bulan":3.3,"npv":3750000,"irr":19.2,"status":"aktif","catatan":"Proyeksi moderat"},
    {"id":"PROY-003","brand":"Experience","product_id":"SM-003","product_name":"Sukuk Experience Store","investasi":100000000,"bagi_hasil_bulanan":3000000,"return_6bulan":18000000,"return_12bulan":36000000,"roi_persen":36,"payback_bulan":3.3,"npv":5000000,"irr":20.1,"status":"aktif","catatan":"Proyeksi optimis"}
  ],
  store: [
    {"id":"STO-001","brand":"Wangi Parfum","kategori":"Retail","lokasi":"Jakarta - Senayan","revenue_bulanan":25000000,"unit_terjual":500,"avg_ticket":50000,"pelanggan_aktif":1200,"conversion_rate":3.5,"nps":72,"status":"aktif","catatan":"Store flagship"},
    {"id":"STO-002","brand":"Wangi Parfum","kategori":"Online","lokasi":"Shopee Official","revenue_bulanan":15000000,"unit_terjual":300,"avg_ticket":50000,"pelanggan_aktif":800,"conversion_rate":4.2,"nps":78,"status":"aktif","catatan":"Tokopedia + Shopee"},
    {"id":"STO-003","brand":"Experience","kategori":"Pop-up","lokasi":"Bandung - Kota","revenue_bulanan":10000000,"unit_terjual":200,"avg_ticket":50000,"pelanggan_aktif":400,"conversion_rate":5.0,"nps":80,"status":"aktif","catatan":"Pop-up store event"}
  ]
};

// In-memory mutable state for POST operations
let _investors = [...SUKUK_LOCAL_DATA.investors];
let _products = [...SUKUK_LOCAL_DATA.products];
let _nextInvestorId = 6;
let _nextProductId = 6;

export function getLocalInvestors() {
  return _investors;
}

export function getLocalCreditors() {
  return SUKUK_LOCAL_DATA.creditors;
}

export function getLocalProducts() {
  return _products;
}

export function getLocalInvestments() {
  return SUKUK_LOCAL_DATA.investments;
}

export function getLocalDistributions() {
  return SUKUK_LOCAL_DATA.distributions;
}

export function getLocalRAB() {
  return SUKUK_LOCAL_DATA.rab;
}

export function getLocalSchedule() {
  return SUKUK_LOCAL_DATA.schedule;
}

export function getLocalAudit() {
  return SUKUK_LOCAL_DATA.audit;
}

export function getLocalNotifications() {
  return SUKUK_LOCAL_DATA.notifications;
}

export function getLocalProyeksi() {
  return SUKUK_LOCAL_DATA.proyeksi;
}

export function getLocalStore() {
  return SUKUK_LOCAL_DATA.store;
}

export function addLocalInvestor(investor: Record<string, unknown>) {
  const newInvestor = {
    ...investor,
    id: investor.id || `INV-${String(_nextInvestorId++).padStart(3, "0")}`,
    status: investor.status || "aktif",
    consent: investor.consent || "1",
    tanggal_daftar: investor.tanggal_daftar || new Date().toISOString().slice(0, 10),
  };
  _investors.push(newInvestor as typeof SUKUK_LOCAL_DATA.investors[0]);
  return newInvestor;
}

export function addLocalProduct(product: Record<string, unknown>) {
  const newProduct = {
    ...product,
    id: _nextProductId++,
  };
  _products.push(newProduct as typeof SUKUK_LOCAL_DATA.products[0]);
  return newProduct;
}
