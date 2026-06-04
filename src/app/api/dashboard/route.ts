// GET /api/dashboard — Aggregate data from Google Sheets (real data)
import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

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
    ] = await Promise.all([
      readSheet("RekeningKoran").catch(() => []),
      readSheet("RekapRekening").catch(() => []),
      readSheet("PemegangSaham").catch(() => []),
      readSheet("SukukStore").catch(() => []),
      readSheet("SukukInvestor").catch(() => []),
      readSheet("LaporanBulanan").catch(() => []),
      readSheet("BudgetVsActual").catch(() => []),
      readSheet("DivisiShareholders").catch(() => []),
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
    let shareholders: any[] = [];
    let totalModalDitempatkan = 0;
    let totalSudahSetor = 0;
    if (pemegangSaham.length >= 6) {
      // Row 5 is header, rows 6+ are data
      for (let i = 6; i < pemegangSaham.length; i++) {
        const row = pemegangSaham[i];
        if (row.length >= 7 && row[0] && row[0] !== "TOTAL:") {
          const jumlahSaham = parseInt(row[2]) || 0;
          const nilai = parseFloat((row[3] || "0").replace(/[^\d.-]/g, "")) || 0;
          const kewajiban = parseFloat((row[5] || "0").replace(/[^\d.-]/g, "")) || 0;
          const sudahSetor = parseFloat((row[6] || "0").replace(/[^\d.-]/g, "")) || 0;
          shareholders.push({
            no: row[0],
            nama: row[1],
            jumlahSaham,
            nilai,
            persen: row[4],
            kewajiban,
            sudahSetor,
            progress: kewajiban > 0 ? ((sudahSetor / kewajiban) * 100) : 0,
          });
          totalModalDitempatkan += nilai;
          totalSudahSetor += sudahSetor;
        }
      }
    }

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

    return NextResponse.json({
      bankAccounts,
      totalSaldoAkhir,
      shareholders,
      totalModalDasar: 1000000000,
      totalModalDitempatkan,
      totalSudahSetor,
      totalSetoranPercent: totalModalDitempatkan > 0 ? (totalSudahSetor / totalModalDitempatkan) * 100 : 0,
      sukukInfo,
      sukukInvestors,
      totalUnitTerjual,
      rekapData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: String(error) },
      { status: 500 }
    );
  }
}
