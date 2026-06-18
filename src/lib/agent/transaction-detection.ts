// Transaction Detection — reads bank mutations from Rekening_Koran sheet
// and suggests categories based on COA patterns

import { readRange } from "@/lib/sheets/sheets-real";

export type TransactionType = "pemasukan" | "pengeluaran" | "transfer";

export interface DetectedTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  suggestedType: TransactionType;
  suggestedCategory: string;
  confidence: "high" | "medium" | "low";
  rawRow: string[];
}

// Category keywords for auto-detection
const CATEGORY_PATTERNS: Record<string, { keywords: string[]; type: TransactionType; coa?: string }> = {
  "Penjualan Parfum": {
    keywords: ["penjualan", "sale", "revenue", "omzet", "penjualan parfum"],
    type: "pemasukan",
    coa: "4-1000",
  },
  "Pembelian Bahan Baku": {
    keywords: ["bahan baku", "raw material", "pembelian bahan", "supplier"],
    type: "pengeluaran",
    coa: "5-1000",
  },
  "Gaji Karyawan": {
    keywords: ["gaji", "salary", "payroll", "thr", "bonus"],
    type: "pengeluaran",
    coa: "5-2000",
  },
  "Sewa/Tempat": {
    keywords: ["sewa", "rent", "tempat", "kantor", "gudang"],
    type: "pengeluaran",
    coa: "5-3000",
  },
  "Listrik & Utilitas": {
    keywords: ["listrik", "pln", "token", "air", "pam", "utilitas", "telkom", "internet"],
    type: "pengeluaran",
    coa: "5-4000",
  },
  "Pengiriman/Shipping": {
    keywords: ["pengiriman", "shipping", "ekspedisi", "jne", "jnt", "sicepat", "anteraja"],
    type: "pengeluaran",
    coa: "5-5000",
  },
  "Pajak": {
    keywords: ["pajak", "tax", "ppn", "pph", "djponline", "efaktur"],
    type: "pengeluaran",
    coa: "5-6000",
  },
  "Bank/Transfer": {
    keywords: ["transfer", "trf", "bank", "bi-fast", "rtgs"],
    type: "transfer",
  },
  "Event Revenue": {
    keywords: ["event", "booth", "tenant", "sponsor", "pameran", "bazaar"],
    type: "pemasukan",
    coa: "4-2000",
  },
  "Packaging": {
    keywords: ["packaging", "kemasan", "botol", "label", "box", "packaging material"],
    type: "pengeluaran",
    coa: "5-1100",
  },
};

function parseAmount(value: string): number {
  if (!value) return 0;
  // Handle Indonesian number format: 1.000.000,00 or 1,000,000.00
  const cleaned = value.replace(/[^\d.,-]/g, "");
  if (cleaned.includes(",")) {
    // Indonesian format: 1.000.000,50
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return Number(cleaned) || 0;
}

function suggestCategory(description: string): {
  category: string;
  type: TransactionType;
  confidence: "high" | "medium" | "low";
} {
  const lowerDesc = description.toLowerCase();

  for (const [category, config] of Object.entries(CATEGORY_PATTERNS)) {
    for (const keyword of config.keywords) {
      if (lowerDesc.includes(keyword)) {
        return { category, type: config.type, confidence: "high" };
      }
    }
  }

  // Fallback: medium confidence based on common patterns
  if (lowerDesc.includes("cr") || lowerDesc.includes("kredit masuk")) {
    return { category: "Pemasukan Lainnya", type: "pemasukan", confidence: "medium" };
  }
  if (lowerDesc.includes("db") || lowerDesc.includes("debet keluar")) {
    return { category: "Pengeluaran Lainnya", type: "pengeluaran", confidence: "medium" };
  }

  return { category: "Perlu Review", type: "pengeluaran", confidence: "low" };
}

export async function detectTransactions(): Promise<{
  transactions: DetectedTransaction[];
  summary: {
    total: number;
    pemasukan: number;
    pengeluaran: number;
    transfer: number;
    needsReview: number;
  };
}> {
  // Read from Rekening_Koran mutasi section (rows 10-28 based on SHEETS config)
  const rows = await readRange("Rekening_Koran!A10:L28");

  const transactions: DetectedTransaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((cell) => cell && cell.trim())) continue;

    const date = row[0]?.trim() || "";
    const description = row[1]?.trim() || row[2]?.trim() || "";
    const debit = parseAmount(row[3] || row[4] || "");
    const credit = parseAmount(row[5] || row[6] || "");
    const balance = parseAmount(row[7] || row[8] || row[9] || "");

    if (!description) continue;

    const suggestion = suggestCategory(description);

    transactions.push({
      id: `txn-${date.replace(/[^0-9]/g, "")}-${i}`,
      date,
      description,
      debit,
      credit,
      balance,
      suggestedType: suggestion.type,
      suggestedCategory: suggestion.category,
      confidence: suggestion.confidence,
      rawRow: row,
    });
  }

  const summary = {
    total: transactions.length,
    pemasukan: transactions.filter((t) => t.suggestedType === "pemasukan").length,
    pengeluaran: transactions.filter((t) => t.suggestedType === "pengeluaran").length,
    transfer: transactions.filter((t) => t.suggestedType === "transfer").length,
    needsReview: transactions.filter((t) => t.confidence === "low").length,
  };

  return { transactions, summary };
}

// Format transaction for Telegram message
export function formatTransactionForTelegram(tx: DetectedTransaction): string {
  const typeEmoji = { pemasukan: "🟢", pengeluaran: "🔴", transfer: "🔵" }[tx.suggestedType];
  const confEmoji = { high: "✅", medium: "⚠️", low: "❓" }[tx.confidence];

  return `${typeEmoji} <b>${tx.suggestedCategory}</b> ${confEmoji}
📅 ${tx.date}
📝 ${tx.description}
💰 ${tx.debit > 0 ? `Debit: Rp ${tx.debit.toLocaleString("id-ID")}` : `Kredit: Rp ${tx.credit.toLocaleString("id-ID")}`}
📊 Saldo: Rp ${tx.balance.toLocaleString("id-ID")}`;
}
