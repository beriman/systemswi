// GET /api/ecommerce — Read e-commerce transactions from Ecommerse sheet
// POST /api/ecommerce — Create new transaction
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows, updateRow, deleteRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type EcomTransaction = {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  channel: string;
  customerRef: string;
  notes: string;
  rowNumber: number;
};

function parseTransactions(rows: string[][]): EcomTransaction[] {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => ({
      id: String(row[0] || `ecom-${index + 2}`),
      date: String(row[1] || ""),
      type: String(row[2] || "sales"),
      category: String(row[3] || ""),
      description: String(row[4] || ""),
      amount: Number(row[5]) || 0,
      status: String(row[6] || "completed"),
      channel: String(row[7] || ""),
      customerRef: String(row[8] || ""),
      notes: String(row[9] || ""),
      rowNumber: index + 2,
    }))
    .filter((t) => t.date || t.description);
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export async function GET() {
  try {
    let rows: string[][] = [];
    try {
      rows = await readRange("Ecommerse!A1:Z1000");
    } catch {
      return NextResponse.json({
        source: "empty",
        sourceStatus: "empty",
        message: "Sheet Ecommerse tidak tersedia",
        transactions: [],
        metrics: null,
      });
    }

    const transactions = parseTransactions(rows);

    if (transactions.length === 0) {
      return NextResponse.json({
        source: "Ecommerse",
        sourceStatus: "empty",
        message: "Sheet ada tapi tidak ada data transaksi",
        transactions: [],
        metrics: null,
      });
    }

    // Calculate metrics
    const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
    const totalOrders = transactions.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Unique categories
    const categoriesSet = new Set<string>();
    transactions.forEach((t) => { if (t.category) categoriesSet.add(t.category); });
    const categories = Array.from(categoriesSet);

    return NextResponse.json({
      source: "Ecommerse",
      sourceStatus: "live",
      transactions: transactions.slice(0, 100),
      metrics: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        categories,
        lastTransaction: transactions[0]?.date || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membaca e-commerce", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "create");

    if (action === "create") {
      const date = body.date || new Date().toISOString().slice(0, 10);
      const type = body.type || "sales";
      const category = body.category || "parfum";
      const description = body.description || "";
      const amount = Number(body.amount) || 0;
      const status = body.status || "completed";
      const channel = body.channel || "online";
      const customerRef = body.customerRef || "";
      const notes = body.notes || "";

      if (!description || amount <= 0) {
        return NextResponse.json({ error: "description dan amount wajib diisi" }, { status: 400 });
      }

      const id = `ecom-${Date.now()}`;
      const row = [id, date, type, category, description, amount, status, channel, customerRef, notes];
      await appendRows("Ecommerse", [row]);

      return NextResponse.json(
        { success: true, action, transaction: { id, date, amount, description }, syncedSheets: ["Ecommerse"] },
        { status: 201 }
      );
    }

    if (action === "update") {
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

      const rows = await readRange("Ecommerse!A1:Z1000");
      const transactions = parseTransactions(rows);
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return NextResponse.json({ error: "transaksi tidak ditemukan" }, { status: 404 });

      const row = [
        tx.id,
        body.date || tx.date,
        body.type || tx.type,
        body.category || tx.category,
        body.description || tx.description,
        Number(body.amount) || tx.amount,
        body.status || tx.status,
        body.channel || tx.channel,
        body.customerRef || tx.customerRef,
        body.notes || tx.notes,
      ];
      await updateRow("Ecommerse", tx.rowNumber, row);
      return NextResponse.json({ success: true, action, syncedSheets: ["Ecommerse"] });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

      const rows = await readRange("Ecommerse!A1:Z1000");
      const transactions = parseTransactions(rows);
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return NextResponse.json({ error: "transaksi tidak ditemukan" }, { status: 404 });

      await deleteRow("Ecommerse", tx.rowNumber);
      return NextResponse.json({ success: true, action, deleted: id, syncedSheets: ["Ecommerse"] });
    }

    return NextResponse.json(
      { error: "action tidak valid. Pilih: create, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan e-commerce", details: String(error) },
      { status: 500 }
    );
  }
}
