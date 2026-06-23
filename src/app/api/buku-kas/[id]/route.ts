import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, writeRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const s = (row: string[], idx: number): string => row[idx] || "";

interface BukuKasEntry {
  id: string;
  rowNumber: number;
  tanggal: string;
  kodeAkun: string;
  kategori: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  referensi: string;
  divisi: string;
}

function parseBukuKasRows(rows: string[][]): BukuKasEntry[] {
  // Row 1 = header, data starts at row 2 (sheet row number = index + 2)
  return rows.slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => ({
      id: `${row[0] || "row"}-${index}`,
      rowNumber: index + 2, // +2 because sheet row 1 is header
      tanggal: s(row, 0),
      kodeAkun: s(row, 1),
      kategori: s(row, 2),
      deskripsi: s(row, 3),
      debit: money(row[4]),
      kredit: money(row[5]),
      referensi: s(row, 6),
      divisi: s(row, 7),
    }));
}

// Find entry by id (format: "tanggal-index")
function findEntry(entries: BukuKasEntry[], id: string): BukuKasEntry | undefined {
  return entries.find((e) => e.id === id);
}

// ── GET /api/buku-kas/[id] — Get single entry detail ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const rows = await readRange("Buku_Kas!A1:H1000");
    const entries = parseBukuKasRows(rows);
    const entry = findEntry(entries, decodedId);

    if (!entry) {
      return NextResponse.json({ error: "Entry tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      source: "Google Sheets: Buku_Kas",
      sourceStatus: "live",
      entry,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Buku_Kas", error),
        entry: null,
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca detail entry", details: String(error) },
      { status: 500 }
    );
  }
}

// ── PUT /api/buku-kas/[id] — Update entry ──
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const body = await req.json();

    const rows = await readRange("Buku_Kas!A1:H1000");
    const entries = parseBukuKasRows(rows);
    const entry = findEntry(entries, decodedId);

    if (!entry) {
      return NextResponse.json({ error: "Entry tidak ditemukan" }, { status: 404 });
    }

    // Build updated row
    const tanggal = body.tanggal || entry.tanggal;
    const kodeAkun = body.kodeAkun || entry.kodeAkun;
    const kategori = body.kategori || entry.kategori;
    const deskripsi = body.deskripsi || entry.deskripsi;
    const debit = body.type === "credit" ? 0 : money(body.amount) || entry.debit;
    const kredit = body.type === "credit" ? money(body.amount) || entry.kredit : 0;
    const referensi = body.referensi || entry.referensi;
    const divisi = body.divisi || entry.divisi;

    const updatedRow = [
      tanggal,
      kodeAkun,
      kategori,
      deskripsi,
      debit,
      kredit,
      referensi,
      divisi,
    ];

    // Write to the specific row
    const range = `Buku_Kas!A${entry.rowNumber}:H${entry.rowNumber}`;
    await writeRange(range, [updatedRow]);

    return NextResponse.json({
      success: true,
      source: "Google Sheets: Buku_Kas",
      entry: {
        ...entry,
        tanggal,
        kodeAkun,
        kategori,
        deskripsi,
        debit,
        kredit,
        referensi,
        divisi,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          source: "Google Sheets: Buku_Kas",
          sourceStatus: "blocked",
          error: "Google Workspace OAuth expired, tidak bisa update Buku_Kas",
          details: String(error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Gagal update entry Buku Kas", details: String(error) },
      { status: 500 }
    );
  }
}
