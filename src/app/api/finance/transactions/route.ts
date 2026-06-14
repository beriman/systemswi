import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type FinanceTransactionInput = {
  tanggal?: string;
  jenis?: "pemasukan" | "pengeluaran";
  divisi?: string;
  kodeAkun?: string;
  kategori?: string;
  deskripsi?: string;
  jumlah?: number | string;
  sumber?: string;
  referensi?: string;
  proofUrl?: string;
  catatan?: string;
};

const money = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, ""));
  return 0;
};

const normalizeDate = (value?: string) => value || new Date().toISOString().slice(0, 10);

function mapCashRow(input: Required<FinanceTransactionInput>, amount: number, timestamp: string) {
  const debit = input.jenis === "pemasukan" ? amount : 0;
  const kredit = input.jenis === "pengeluaran" ? amount : 0;
  const proof = [input.referensi, input.proofUrl].filter(Boolean).join(" | ");
  const notes = [input.sumber ? `Sumber: ${input.sumber}` : "", input.catatan].filter(Boolean).join(" — ");

  // Cash_Harian currently stores rows as:
  // Tgl | Kode Akun | Kategori | Deskripsi | Debit | Kredit | Timestamp/Ref | Divisi | Keterangan/Proof
  return [
    input.tanggal,
    input.kodeAkun,
    input.kategori,
    input.deskripsi,
    debit,
    kredit,
    proof || timestamp,
    input.divisi,
    notes || input.proofUrl,
  ];
}

function mapBukuKasRow(input: Required<FinanceTransactionInput>, amount: number, timestamp: string) {
  return [
    input.tanggal,
    input.kodeAkun,
    input.kategori,
    input.deskripsi,
    input.jenis === "pemasukan" ? amount : 0,
    input.jenis === "pengeluaran" ? amount : 0,
    timestamp,
    input.divisi,
  ];
}

function parseRecentRows(rows: string[][]) {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .slice(-25)
    .reverse()
    .map((row, index) => {
      const looksLikeCashActual = /^\d{3,}$/.test(String(row[1] || "")) || money(row[4]) > 0 || money(row[5]) > 0;
      if (looksLikeCashActual) {
        return {
          id: `${row[0] || "row"}-${index}`,
          tanggal: row[0] || "",
          deskripsi: row[3] || row[2] || "",
          debit: money(row[4]),
          kredit: money(row[5]),
          kodeAkun: row[1] || "",
          referensi: row[6] || "",
          catatan: row[8] || "",
          divisi: row[7] || "",
        };
      }
      return {
        id: `${row[0] || "row"}-${index}`,
        tanggal: row[0] || "",
        deskripsi: row[1] || row[3] || "",
        debit: money(row[2]),
        kredit: money(row[3]),
        kodeAkun: row[5] || "",
        referensi: row[6] || "",
        catatan: row[7] || "",
        divisi: row[8] || "",
      };
    });
}

async function writeLocalAudit(input: Required<FinanceTransactionInput>, amount: number, timestamp: string) {
  try {
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (user_id, user_name, action, module, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      "hemuhemu",
      "Hermes/HemuHemu",
      "finance_transaction_create",
      "finance",
      JSON.stringify({
        timestamp,
        tanggal: input.tanggal,
        jenis: input.jenis,
        divisi: input.divisi,
        kodeAkun: input.kodeAkun,
        jumlah: amount,
        referensi: input.referensi,
        proofUrl: input.proofUrl,
      })
    );
  } catch (error) {
    console.warn("Local audit log skipped", error);
  }
}

export async function GET() {
  try {
    const rows = await readRange("Cash_Harian!A1:I200");
    const transactions = parseRecentRows(rows);
    const summary = transactions.reduce(
      (acc, tx) => {
        acc.totalPemasukan += tx.debit;
        acc.totalPengeluaran += tx.kredit;
        acc.totalTransaksi += 1;
        return acc;
      },
      { totalPemasukan: 0, totalPengeluaran: 0, totalTransaksi: 0 }
    );

    return NextResponse.json({
      source: "Google Sheets: Cash_Harian",
      transactions,
      summary,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Cash_Harian", error),
        transactions: [],
        summary: { totalPemasukan: 0, totalPengeluaran: 0, totalTransaksi: 0 },
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca transaksi finance", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FinanceTransactionInput;
    const amount = money(body.jumlah);

    if (!body.jenis || !["pemasukan", "pengeluaran"].includes(body.jenis)) {
      return NextResponse.json({ error: "jenis wajib pemasukan atau pengeluaran" }, { status: 400 });
    }
    if (!body.deskripsi || !amount || amount <= 0) {
      return NextResponse.json({ error: "deskripsi dan jumlah wajib diisi" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const input: Required<FinanceTransactionInput> = {
      tanggal: normalizeDate(body.tanggal),
      jenis: body.jenis,
      divisi: body.divisi || "Holding",
      kodeAkun: body.kodeAkun || (body.jenis === "pemasukan" ? "401" : "501"),
      kategori: body.kategori || (body.jenis === "pemasukan" ? "Pendapatan" : "Pengeluaran"),
      deskripsi: body.deskripsi,
      jumlah: amount,
      sumber: body.sumber || "bank",
      referensi: body.referensi || "",
      proofUrl: body.proofUrl || "",
      catatan: body.catatan || "",
    };

    const cashRow = mapCashRow(input, amount, timestamp);
    const bukuKasRow = mapBukuKasRow(input, amount, timestamp);

    await appendRows("Cash_Harian", [cashRow]);
    await appendRows("Buku_Kas", [bukuKasRow]);
    await writeLocalAudit(input, amount, timestamp);

    return NextResponse.json(
      {
        success: true,
        source: "Google Sheets",
        transaction: {
          ...input,
          jumlah: amount,
          timestamp,
          proofTracked: Boolean(input.proofUrl),
        },
        syncedSheets: ["Cash_Harian", "Buku_Kas"],
        auditTrail: "Local audit_log recorded; Cash_Harian Ref/Keterangan stores reference + proof URL.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi finance", details: String(error) },
      { status: 500 }
    );
  }
}
