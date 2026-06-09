// GET /api/dashboard — Aggregate data from Google Sheets (real data)
import { NextResponse } from "next/server";
import { readRanges, readSheet } from "@/lib/sheets/sheets-real";
import { EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";

function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  return Number(raw.replace(/[^\d.-]/g, "")) || 0;
}

function parsePercent(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "0%";
  const numeric = Number(raw.replace(",", "."));
  if (Number.isFinite(numeric)) {
    return numeric <= 1 ? `${(numeric * 100).toFixed(0)}%` : `${numeric.toFixed(0)}%`;
  }
  return raw;
}

function isShareholderRow(row: string[]): boolean {
  return /^\d+$/.test(String(row[0] ?? "").trim()) && Boolean(row[1]);
}

function cell(row: string[], idx: number): string {
  return row[idx] || "";
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function summarizeBrands(masterRows: string[][], productionRows: string[][], salesRows: string[][], expenseRows: string[][]) {
  const brands = masterRows.slice(1).filter((row) => cell(row, 0) || cell(row, 1));
  const production = productionRows.slice(1).filter((row) => cell(row, 0) || cell(row, 4) || cell(row, 5));
  const sales = salesRows.slice(1).filter((row) => cell(row, 0) || cell(row, 4) || cell(row, 5));
  const expenses = expenseRows.slice(1).filter((row) => cell(row, 0) || cell(row, 4) || cell(row, 5));

  const productionQty = production.reduce((sum, row) => sum + parseNumber(row[8]), 0);
  const productionCost = production.reduce((sum, row) => sum + (parseNumber(row[15]) || parseNumber(row[11])), 0);
  const activeBatches = production.filter((row) => !["cancelled", "archived"].includes(cell(row, 16).toLowerCase())).length;
  const unitsSold = sales.reduce((sum, row) => sum + parseNumber(row[7]), 0);
  const netRevenue = sales.reduce((sum, row) => sum + parseNumber(row[11]), 0);
  const cogs = sales.reduce((sum, row) => sum + parseNumber(row[12]), 0);
  const expensesTotal = expenses.reduce((sum, row) => sum + parseNumber(row[7]), 0);
  const stockEstimate = productionQty - unitsSold;

  return {
    brandCount: brands.length,
    productionQty,
    productionCost,
    activeBatches,
    unitsSold,
    stockEstimate,
    avgHppPerUnit: productionQty ? productionCost / productionQty : 0,
    netRevenue,
    operatingProfit: netRevenue - cogs - expensesTotal,
    latestBatches: production.slice(-3).reverse().map((row) => ({
      date: cell(row, 1),
      brandName: cell(row, 3),
      sku: cell(row, 4),
      productName: cell(row, 5),
      qtyProduced: parseNumber(row[8]),
      status: cell(row, 16) || cell(row, 12) || "Planned",
      qcStatus: cell(row, 17) || "Unchecked",
    })),
  };
}

function summarizeEvents(rows: string[][]) {
  const events = rows.slice(1).filter((row) => cell(row, 0) || cell(row, 1));
  const upcomingStatuses = new Set(["planning", "open-registration", "planned"]);
  const totalBudget = events.reduce((sum, row) => sum + parseNumber(row[12]), 0);
  const totalCost = events.reduce((sum, row) => sum + parseNumber(row[13]), 0);
  const totalRevenue = events.reduce((sum, row) => sum + parseNumber(row[14]), 0);
  const upcoming = events.filter((row) => upcomingStatuses.has(cell(row, 4).toLowerCase())).length;
  const completed = events.filter((row) => cell(row, 4).toLowerCase() === "completed").length;

  return {
    totalEvents: events.length,
    upcoming,
    completed,
    totalBudget,
    totalCost,
    totalRevenue,
    latestEvents: events.slice(-4).reverse().map((row) => ({
      id: cell(row, 0),
      name: cell(row, 1),
      slug: cell(row, 2),
      type: cell(row, 3),
      status: cell(row, 4),
      startDate: cell(row, 8),
      venue: cell(row, 11) || cell(row, 10),
      pic: cell(row, 6),
    })),
  };
}

export async function GET() {
  try {
    // ── Read all finance data from Google Sheets ──
    const [
      rekeningKoran,
      rekapRekening,
      pemegangSaham,
      sukukStore,
      sukukInvestor,
      laporanBulanan,
      budgetVsActual,
      divisiShareholders,
      brandRanges,
      eventRows,
    ] = await Promise.all([
      readSheet("RekeningKoran").catch(() => []),
      readSheet("RekapRekening").catch(() => []),
      readSheet("PemegangSaham").catch(() => []),
      readSheet("SukukStore").catch(() => []),
      readSheet("SukukInvestor").catch(() => []),
      readSheet("LaporanBulanan").catch(() => []),
      readSheet("BudgetVsActual").catch(() => []),
      readSheet("DivisiShareholders").catch(() => []),
      readRanges([
        "Brand_Master!A1:K200",
        "Brand_Production!A1:T1000",
        "Brand_Sales!A1:N1000",
        "Brand_Expenses!A1:L1000",
      ]).catch(() => ({})),
      readEventSheet(EVENT_SHEETS.Events).catch(() => []),
    ]);

    // ── Parse bank balances from RekeningKoran ──
    let bankAccounts: any[] = [];
    let totalSaldoAkhir = 0;
    if (rekeningKoran.length >= 3) {
      // Rows 0-2 are bank accounts, row 3 is empty, row 4+ is mutasi
      for (let i = 0; i < Math.min(3, rekeningKoran.length); i++) {
        const row = rekeningKoran[i];
        if (row.length >= 5 && row[0]) {
          const saldoAkhir = parseFloat((row[4] || "0").replace(/[^\d.-]/g, "")) || 0;
          bankAccounts.push({
            bank: row[0],
            noRek: row[1],
            nama: row[2],
            saldoAwal: row[3],
            saldoAkhir: row[4],
            saldoAkhirNum: saldoAkhir,
          });
          totalSaldoAkhir += saldoAkhir;
        }
      }
    }

    // ── Parse shareholders from PemegangSaham ──
    // Google Sheets is the source of truth. Do not assume fixed row numbers:
    // the sheet has title/subtitle rows before the table and note rows after it.
    const shareholders = pemegangSaham
      .filter(isShareholderRow)
      .map((row) => {
        const jumlahSaham = Number.parseInt(String(row[2] ?? "0"), 10) || 0;
        const nilai = parseMoney(row[3]);
        const kewajiban = parseMoney(row[5] ?? row[3]);
        const sudahSetor = parseMoney(row[6]);
        const sisaKewajiban = row[7] ? parseMoney(row[7]) : Math.max(kewajiban - sudahSetor, 0);
        const progress = kewajiban > 0 ? (sudahSetor / kewajiban) * 100 : 0;

        return {
          no: row[0],
          nama: row[1],
          jumlahSaham,
          nilai,
          persen: parsePercent(row[4]),
          kewajiban,
          sudahSetor,
          sisaKewajiban,
          status: row[8] || (sisaKewajiban <= 0 ? "Lunas" : "Dalam Proses"),
          progress,
        };
      });

    const totalJumlahSaham = shareholders.reduce((sum, sh) => sum + sh.jumlahSaham, 0);
    const totalModalDitempatkan = shareholders.reduce((sum, sh) => sum + sh.nilai, 0);
    const totalSudahSetor = shareholders.reduce((sum, sh) => sum + sh.sudahSetor, 0);
    const totalSisaKewajiban = shareholders.reduce((sum, sh) => sum + sh.sisaKewajiban, 0);
    const shareholderNotes = pemegangSaham
      .map((row) => row[0])
      .filter((cell): cell is string => typeof cell === "string" && /^\d+\./.test(cell.trim()));

    // ── Parse sukuk info ──
    let sukukInfo: any = {};
    if (sukukStore.length >= 4) {
      for (const row of sukukStore) {
        if (row[0] === "Jenis Akad:") sukukInfo.akad = row[1];
        if (row[0] === "Nilai Sukuk:") sukukInfo.nilai = row[1];
        if (row[0] === "Nisbah Bagi Hasil:") sukukInfo.nisbah = row[1];
        if (row[0] === "Yield Estimasi:") sukukInfo.yield = row[1];
        if (row[0] === "Status:") sukukInfo.status = row[1];
      }
    }

    // ── Parse sukuk investors ──
    let sukukInvestors: any[] = [];
    let totalUnitTerjual = 0;
    if (sukukInvestor.length >= 2) {
      for (let i = 1; i < sukukInvestor.length; i++) {
        const row = sukukInvestor[i];
        if (row.length >= 5 && row[0] && row[0] !== "TOTAL") {
          const unit = parseInt(row[3]) || 0;
          const nominal = parseFloat((row[4] || "0").replace(/[^\d.-]/g, "")) || 0;
          sukukInvestors.push({
            no: row[0],
            nama: row[1],
            jenis: row[2],
            unit,
            nominal,
            persen: row[5],
            tanggal: row[6],
            status: row[7],
          });
          totalUnitTerjual += unit;
        }
      }
    }

    // ── Parse rekap rekening (8 months) ──
    let rekapData: any[] = [];
    if (rekapRekening.length >= 6) {
      // Find Holding section
      let inHolding = false;
      let inWebsite = false;
      for (const row of rekapRekening) {
        if (row[0] === "REKENING BRI HOLDING — 201101000546304") { inHolding = true; inWebsite = false; continue; }
        if (row[0] === "REKENING BRI WEBSITE — 201101000555303") { inHolding = false; inWebsite = true; continue; }
        if (row[0] === "Bulan" || row[0] === "") continue;
        
        if (inHolding && row.length >= 8) {
          rekapData.push({
            bulan: row[0],
            periode: row[1],
            saldoAwal: row[2],
            totalMasuk: row[3],
            totalKeluar: row[4],
            saldoAkhir: row[5],
            saldoAkhirNum: parseFloat((row[5] || "0").replace(/[^\d.-]/g, "")) || 0,
            jTxns: row[6],
            status: row[7],
            akun: "Holding",
          });
        }
        if (inWebsite && row.length >= 7) {
          rekapData.push({
            bulan: row[0],
            periode: row[1],
            saldoAwal: row[2],
            totalMasuk: row[3],
            totalKeluar: row[4],
            saldoAkhir: row[5],
            saldoAkhirNum: parseFloat((row[5] || "0").replace(/[^\d.-]/g, "")) || 0,
            jTxns: row[6],
            akun: "Website",
          });
        }
      }
    }

    const brandSummary = summarizeBrands(
      brandRanges["Brand_Master!A1:K200"] || [],
      brandRanges["Brand_Production!A1:T1000"] || [],
      brandRanges["Brand_Sales!A1:N1000"] || [],
      brandRanges["Brand_Expenses!A1:L1000"] || []
    );
    const eventSummary = summarizeEvents(eventRows);

    return NextResponse.json({
      bankAccounts,
      totalSaldoAkhir,
      shareholders,
      totalModalDasar: 1000000000,
      totalJumlahSaham,
      totalModalDitempatkan,
      totalSudahSetor,
      totalSisaKewajiban,
      totalSetoranPercent: totalModalDitempatkan > 0 ? (totalSudahSetor / totalModalDitempatkan) * 100 : 0,
      sharePrice: 100000,
      shareholderNotes,
      shareholderDataSource: "Google Sheets: PemegangSaham!A1:I16",
      sukukInfo,
      sukukInvestors,
      totalUnitTerjual,
      rekapData,
      brandSummary,
      eventSummary,
      executiveSnapshot: {
        cash: totalSaldoAkhir,
        paidInCapital: totalSudahSetor,
        openCapitalObligation: totalSisaKewajiban,
        eventCount: eventSummary.totalEvents,
        upcomingEvents: eventSummary.upcoming,
        productionQty: brandSummary.productionQty,
        activeBatches: brandSummary.activeBatches,
        estimatedStock: brandSummary.stockEstimate,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: String(error) },
      { status: 500 }
    );
  }
}
