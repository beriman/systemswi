import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRanges } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const DIVISIONS = ["Produksi", "Store", "Event", "Ecommerse", "Digital"];
const SETORAN_RATE = 0.3;

function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;
}

function cell(row: string[], index: number): string {
  return String(row[index] ?? "").trim();
}

function normalizeDivision(value: string): string {
  const raw = value.toLowerCase();
  if (raw.includes("produksi") || raw.includes("production")) return "Produksi";
  if (raw.includes("store") || raw.includes("tim")) return "Store";
  if (raw.includes("event") || raw.includes("fragrantions")) return "Event";
  if (raw.includes("ecom") || raw.includes("marketplace") || raw.includes("online")) return "Ecommerse";
  if (raw.includes("digital")) return "Digital";
  if (raw.includes("holding")) return "Holding";
  return value || "TBA";
}

function monthKey(dateValue: string): string {
  const iso = dateValue.match(/\d{4}-\d{2}/)?.[0];
  if (iso) return iso;
  const dmy = dateValue.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}`;
  return new Date().toISOString().slice(0, 7);
}

function isHeader(row: string[]) {
  return row.join(" ").toLowerCase().includes("tgl") || row.join(" ").toLowerCase().includes("kode akun");
}

function parseCashRows(rows: string[][]) {
  return rows
    .filter((row) => row.some(Boolean) && !isHeader(row))
    .map((row) => ({
      tanggal: cell(row, 0),
      kodeAkun: cell(row, 1),
      kategori: cell(row, 2),
      deskripsi: cell(row, 3),
      debit: parseMoney(row[4]),
      kredit: parseMoney(row[5]),
      referensi: cell(row, 6),
      divisi: normalizeDivision(cell(row, 7)),
      notes: cell(row, 8),
    }))
    .filter((tx) => tx.tanggal || tx.deskripsi || tx.debit || tx.kredit);
}

function isSetoranPayment(tx: ReturnType<typeof parseCashRows>[number]) {
  const text = `${tx.kategori} ${tx.deskripsi} ${tx.referensi} ${tx.notes}`.toLowerCase();
  return text.includes("setoran") && text.includes("holding");
}

export async function GET() {
  try {
    const ranges = await readRanges([
      "Cash_Harian!A1:I1000",
      "RekapSetoran!A1:F100",
    ]);
    const transactions = parseCashRows(ranges["Cash_Harian!A1:I1000"] || []);
    const rekapRows = ranges["RekapSetoran!A1:F100"] || [];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const perDivision = DIVISIONS.map((division) => {
      const divisionTransactions = transactions.filter((tx) => tx.divisi === division);
      const revenue = divisionTransactions.reduce((sum, tx) => sum + tx.debit, 0);
      const paid = transactions
        .filter((tx) => isSetoranPayment(tx) && `${tx.deskripsi} ${tx.notes} ${tx.referensi}`.toLowerCase().includes(division.toLowerCase()))
        .reduce((sum, tx) => sum + Math.max(tx.kredit, tx.debit), 0);
      const obligation = Math.round(revenue * SETORAN_RATE);
      const outstanding = Math.max(obligation - paid, 0);
      return {
        division,
        revenue,
        rate: SETORAN_RATE,
        obligation,
        paid,
        outstanding,
        status: obligation === 0 ? "no_revenue" : outstanding <= 0 ? "settled" : paid > 0 ? "partial" : "due",
        suggestedReference: `SETORAN-${currentMonth}-${division.toUpperCase()}`,
      };
    });

    const totalRevenue = perDivision.reduce((sum, row) => sum + row.revenue, 0);
    const totalObligation = perDivision.reduce((sum, row) => sum + row.obligation, 0);
    const totalPaid = perDivision.reduce((sum, row) => sum + row.paid, 0);
    const totalOutstanding = perDivision.reduce((sum, row) => sum + row.outstanding, 0);

    return NextResponse.json({
      source: "Google Sheets: Cash_Harian + RekapSetoran",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      policy: {
        rate: SETORAN_RATE,
        rateLabel: "30%",
        note: "Draft auto-calculation dari pemasukan Cash_Harian per divisi. Operator tetap perlu cek mutasi bank dan RekapSetoran sebelum final posting.",
      },
      summary: {
        totalRevenue,
        totalObligation,
        totalPaid,
        totalOutstanding,
        divisionCount: perDivision.length,
        dueCount: perDivision.filter((row) => row.outstanding > 0).length,
        rekapRows: rekapRows.filter((row) => row.some(Boolean)).length,
      },
      perDivision,
      nextActions: [
        "Cek apakah pemasukan tiap divisi di Cash_Harian sudah lengkap dan memakai kolom Divisi yang benar.",
        "Posting pembayaran setoran 30% sebagai transaksi transfer divisi → Holding dengan referensi yang disarankan.",
        "Jangan samakan saldo bank dengan setoran divisi; setoran dihitung dari revenue operasional per divisi.",
      ],
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Cash_Harian + RekapSetoran", error),
        generatedAt: new Date().toISOString(),
        policy: { rate: SETORAN_RATE, rateLabel: "30%", note: "OAuth blocked; tidak ada angka setoran yang diinventarisasi dari fallback." },
        summary: { totalRevenue: 0, totalObligation: 0, totalPaid: 0, totalOutstanding: 0, divisionCount: 0, dueCount: 0, rekapRows: 0 },
        perDivision: [],
        nextActions: ["Re-auth Google Workspace agar systemswi bisa membaca Cash_Harian dan RekapSetoran."],
      });
    }
    return NextResponse.json({ error: "Gagal menghitung setoran 30%", details: String(error) }, { status: 500 });
  }
}
