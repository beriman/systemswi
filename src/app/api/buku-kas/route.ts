import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const MONEY_COLS = [4, 5]; // Debit (index 4), Kredit (index 5)

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const s = (row: string[], idx: number): string => row[idx] || "";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface BukuKasEntry {
  id: string;
  tanggal: string;
  kodeAkun: string;
  kategori: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  referensi: string;
  divisi: string;
  saldo: number;
}

function parseBukuKasRows(rows: string[][]): BukuKasEntry[] {
  // Buku_Kas columns: Tgl(0) | Kode Akun(1) | Kategori(2) | Deskripsi(3) | Debit(4) | Kredit(5) | Timestamp/Ref(6) | Divisi(7)
  const dataRows = rows.slice(1).filter((row) => row.some(Boolean));
  let runningSaldo = 0;
  return dataRows.map((row, index) => {
    const debit = money(row[4]);
    const kredit = money(row[5]);
    runningSaldo += debit - kredit;
    return {
      id: `${row[0] || "row"}-${index}`,
      tanggal: s(row, 0),
      kodeAkun: s(row, 1),
      kategori: s(row, 2),
      deskripsi: s(row, 3),
      debit,
      kredit,
      referensi: s(row, 6),
      divisi: s(row, 7),
      saldo: runningSaldo,
    };
  });
}

// ── GET /api/buku-kas — List all entries with optional filters ──
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get("category");
    const divisiFilter = url.searchParams.get("divisi");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = Number(url.searchParams.get("limit") || "0");

    const rows = await readRange("Buku_Kas!A1:H1000");
    let entries = parseBukuKasRows(rows);

    // Apply filters
    if (categoryFilter) {
      entries = entries.filter((e) => e.kategori.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (divisiFilter) {
      entries = entries.filter((e) => e.divisi.toLowerCase() === divisiFilter.toLowerCase());
    }
    if (startDate) {
      entries = entries.filter((e) => e.tanggal >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => e.tanggal <= endDate);
    }

    // Sort by tanggal ascending
    entries.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    if (limit > 0) {
      entries = entries.slice(-limit).reverse();
    }

    // Summary
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
    const currentSaldo = entries.length > 0 ? entries[entries.length - 1].saldo : 0;

    return NextResponse.json({
      source: "Google Sheets: Buku_Kas",
      sourceStatus: "live",
      entries,
      summary: {
        totalEntries: entries.length,
        totalDebit,
        totalKredit,
        currentSaldo,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Buku_Kas", error),
        entries: [],
        summary: { totalEntries: 0, totalDebit: 0, totalKredit: 0, currentSaldo: 0 },
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca Buku Kas", details: String(error) },
      { status: 500 }
    );
  }
}

// ── POST /api/buku-kas — Create new entry ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tanggal = body.tanggal || today();
    const kodeAkun = body.kodeAkun || (body.type === "debit" ? "401" : "501");
    const kategori = body.kategori || "Lainnya";
    const deskripsi = body.deskripsi || "";
    const amount = money(body.amount);
    const type = body.type === "credit" ? "credit" : "debit";
    const referensi = body.referensi || "";
    const divisi = body.divisi || "Holding";

    if (!deskripsi) {
      return NextResponse.json({ error: "deskripsi wajib diisi" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "amount wajib diisi dan > 0" }, { status: 400 });
    }

    const debit = type === "debit" ? amount : 0;
    const kredit = type === "credit" ? amount : 0;
    const timestamp = new Date().toISOString();

    // Tgl | Kode Akun | Kategori | Deskripsi | Debit | Kredit | Timestamp/Ref | Divisi
    const row = [
      tanggal,
      kodeAkun,
      kategori,
      deskripsi,
      debit,
      kredit,
      referensi || timestamp,
      divisi,
    ];

    await appendRows("Buku_Kas", [row]);

    return NextResponse.json(
      {
        success: true,
        source: "Google Sheets: Buku_Kas",
        entry: {
          tanggal,
          kodeAkun,
          kategori,
          deskripsi,
          debit,
          kredit,
          referensi: referensi || timestamp,
          divisi,
          type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          source: "Google Sheets: Buku_Kas",
          sourceStatus: "blocked",
          error: "Google Workspace OAuth expired, tidak bisa menulis ke Buku_Kas",
          details: String(error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menyimpan entry Buku Kas", details: String(error) },
      { status: 500 }
    );
  }
}
