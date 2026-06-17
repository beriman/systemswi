// Sukuk Mikro Per Produk — Google Sheets data layer
// Fallback for when SQLite is unavailable (Vercel serverless)
// Sheet: SukukProduk (products), SukukMikro_Investments, SukukMikro_Distributions

import { readRange, appendRows, writeRange } from "./sheets-real";

// ── Sukuk Produk ──────────────────────────────────────────────────
// SukukProduk sheet structure (rows 6+ are data):
// A: ID Produk, B: Nama Produk, C: Deskripsi, D: Jenis,
// E: Modal Dibutuhkan, F: Target Investor, G: Nisbah,
// H: Status, I: PIC Produk, J: Tanggal Launch

export interface SukukProductRow {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  modal_dibutuhkan: number;
  target_investor: number;
  nisbah: string;
  status: string;
  pic: string;
  tanggal_launch: string;
  row_number: number;
}

export async function getSukukProductsFromSheets(): Promise<{
  products: SukukProductRow[];
  source: string;
}> {
  try {
    // Read rows 6 onwards (header at row 6, data from row 7)
    const rows = await readRange("SukukProduk!A6:J100");
    if (!rows || rows.length <= 1) {
      return { products: [], source: "sheets" };
    }

    // Skip header row (index 0), data starts at index 1
    const products: SukukProductRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue; // skip empty rows
      products.push({
        id: row[0] || "",
        nama: row[1] || "",
        deskripsi: row[2] || "",
        kategori: row[3] || "",
        modal_dibutuhkan: Number(row[4]) || 0,
        target_investor: Number(row[5]) || 0,
        nisbah: row[6] || "50:50",
        status: row[7] || "Perencanaan",
        pic: row[8] || "",
        tanggal_launch: row[9] || "",
        row_number: i + 6, // 1-indexed row in sheet (header at 6, data at 7+)
      });
    }
    return { products, source: "sheets" };
  } catch (error) {
    return { products: [], source: "error" };
  }
}

export async function addSukukProductToSheets(product: {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  modal_dibutuhkan: number;
  target_investor: number;
  nisbah: string;
  status: string;
  pic: string;
  tanggal_launch: string;
}): Promise<boolean> {
  try {
    await appendRows("SukukProduk", [[
      product.id,
      product.nama,
      product.deskripsi,
      product.kategori,
      product.modal_dibutuhkan,
      product.target_investor,
      product.nisbah,
      product.status,
      product.pic,
      product.tanggal_launch,
    ]]);
    return true;
  } catch {
    return false;
  }
}

// ── Sukuk Mikro Investments ───────────────────────────────────────
// Sheet: SukukMikro_Investments
// A: ID, B: Product ID, C: Investor Name, D: Investor Email,
// E: Investor Phone, F: Jumlah Unit, G: Nilai Investasi,
// H: Tanggal Investasi, I: Status, J: Consent

export interface SukukInvestmentRow {
  id: number;
  product_id: string;
  investor_name: string;
  investor_email: string;
  investor_phone: string;
  jumlah_unit: number;
  nilai_investasi: number;
  tanggal_investasi: string;
  status: string;
  consent: number;
  row_number: number;
}

const INVESTMENTS_RANGE = "SukukMikro_Investments!A2:J1000";

export async function getSukukInvestmentsFromSheets(productId?: string): Promise<{
  investments: SukukInvestmentRow[];
  source: string;
}> {
  try {
    const rows = await readRange(INVESTMENTS_RANGE);
    if (!rows || rows.length === 0) {
      return { investments: [], source: "sheets" };
    }

    const investments: SukukInvestmentRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;
      const inv = {
        id: Number(row[0]) || (i + 1),
        product_id: row[1] || "",
        investor_name: row[2] || "",
        investor_email: row[3] || "",
        investor_phone: row[4] || "",
        jumlah_unit: Number(row[5]) || 0,
        nilai_investasi: Number(row[6]) || 0,
        tanggal_investasi: row[7] || "",
        status: row[8] || "aktif",
        consent: Number(row[9]) || 0,
        row_number: i + 2, // data starts at row 2
      };
      if (!productId || inv.product_id === productId) {
        investments.push(inv);
      }
    }
    return { investments, source: "sheets" };
  } catch (error) {
    return { investments: [], source: "error" };
  }
}

export async function addSukukInvestmentToSheets(investment: {
  product_id: string;
  investor_name: string;
  investor_email: string;
  investor_phone: string;
  jumlah_unit: number;
  nilai_investasi: number;
  tanggal_investasi: string;
  status: string;
  consent: number;
}): Promise<boolean> {
  try {
    // Generate a simple ID from timestamp
    const id = Date.now();
    await writeRange(`SukukMikro_Investments!A${investment.row_number || 2}:J${investment.row_number || 2}`, [[
      id,
      investment.product_id,
      investment.investor_name,
      investment.investor_email,
      investment.investor_phone,
      investment.jumlah_unit,
      investment.nilai_investasi,
      investment.tanggal_investasi,
      investment.status,
      investment.consent,
    ]]);
    return true;
  } catch {
    // Try append instead
    try {
      const id = Date.now();
      await appendRows("SukukMikro_Investments", [[
        id,
        investment.product_id,
        investment.investor_name,
        investment.investor_email,
        investment.investor_phone,
        investment.jumlah_unit,
        investment.nilai_investasi,
        investment.tanggal_investasi,
        investment.status,
        investment.consent,
      ]]);
      return true;
    } catch {
      return false;
    }
  }
}

// ── Sukuk Mikro Distributions ─────────────────────────────────────
// Sheet: SukukMikro_Distributions
// A: ID, B: Product ID, C: Periode, D: Total Revenue, E: Total COGS,
// F: Total Profit, G: Nisbah Investor, H: Nisbah Pengelola,
// Jumlah Dibagikan, Jumlah Per Unit, Tanggal Pembagian, Status, Notes

export interface SukukDistributionRow {
  id: number;
  product_id: string;
  periode: string;
  total_revenue: number;
  total_cogs: number;
  total_profit: number;
  nisbah_investor: number;
  nisbah_pengelola: number;
  jumlah_dibagikan: number;
  jumlah_per_unit: number;
  tanggal_pembagian: string;
  status: string;
  notes: string;
  row_number: number;
}

const DISTRIBUTIONS_RANGE = "SukukMikro_Distributions!A2:M1000";

export async function getSukukDistributionsFromSheets(productId?: string): Promise<{
  distributions: SukukDistributionRow[];
  source: string;
}> {
  try {
    const rows = await readRange(DISTRIBUTIONS_RANGE);
    if (!rows || rows.length === 0) {
      return { distributions: [], source: "sheets" };
    }

    const distributions: SukukDistributionRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;
      const dist = {
        id: Number(row[0]) || (i + 1),
        product_id: row[1] || "",
        periode: row[2] || "",
        total_revenue: Number(row[3]) || 0,
        total_cogs: Number(row[4]) || 0,
        total_profit: Number(row[5]) || 0,
        nisbah_investor: Number(row[6]) || 50,
        nisbah_pengelola: Number(row[7]) || 50,
        jumlah_dibagikan: Number(row[8]) || 0,
        jumlah_per_unit: Number(row[9]) || 0,
        tanggal_pembagian: row[10] || "",
        status: row[11] || "draft",
        notes: row[12] || "",
        row_number: i + 2,
      };
      if (!productId || dist.product_id === productId) {
        distributions.push(dist);
      }
    }
    return { distributions, source: "sheets" };
  } catch (error) {
    return { distributions: [], source: "error" };
  }
}

export async function addSukukDistributionToSheets(distribution: {
  product_id: string;
  periode: string;
  total_revenue: number;
  total_cogs: number;
  total_profit: number;
  nisbah_investor: number;
  nisbah_pengelola: number;
  jumlah_dibagikan: number;
  jumlah_per_unit: number;
  tanggal_pembagian: string;
  status: string;
  notes: string;
}): Promise<boolean> {
  try {
    const id = Date.now();
    await appendRows("SukukMikro_Distributions", [[
      id,
      distribution.product_id,
      distribution.periode,
      distribution.total_revenue,
      distribution.total_cogs,
      distribution.total_profit,
      distribution.nisbah_investor,
      distribution.nisbah_pengelola,
      distribution.jumlah_dibagikan,
      distribution.jumlah_per_unit,
      distribution.tanggal_pembagian,
      distribution.status,
      distribution.notes,
    ]]);
    return true;
  } catch {
    return false;
  }
}
