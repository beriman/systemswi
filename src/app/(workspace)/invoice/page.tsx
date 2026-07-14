"use client";

import { useState, useCallback, useEffect } from "react";
import { exportElementToPDF, exportContentToPDF } from "@/lib/document/pdf-export";

type LineItem = {
  description: string;
  qty: number;
  unitPrice: number;
};

const INITIAL_ITEMS: LineItem[] = [
  { description: "L'Arc~en~Scent — Eau de Parfum 30ml", qty: 10, unitPrice: 120000 },
  { description: "Pixel Potion — Discovery Set 3x5ml", qty: 5, unitPrice: 180000 },
  { description: "Nuscentza — EDP 30ml", qty: 8, unitPrice: 95000 },
];

export default function InvoicePreview() {
  const [items, setItems] = useState<LineItem[]>(INITIAL_ITEMS);
  const [customerName, setCustomerName] = useState("PT Event Organizer Indonesia");
  const [customerAddress, setCustomerAddress] = useState("Jl. Kemang Raya No. 12, Jakarta Selatan");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [invoiceDate, setInvoiceDate] = useState("2026-06-14");
  const [dueDate, setDueDate] = useState("2026-06-28");
  const [notes, setNotes] = useState("Pembayaran via transfer ke BRI 201101000546304 a/n SWI HOLDING. Mohon konfirmasi setelah transfer.");
  const [isExporting, setIsExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedInvoices, setSavedInvoices] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", qty: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
  }

  const loadSavedInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/invoice");
      if (!res.ok) return;
      const json = await res.json();
      setSavedInvoices(json.invoices || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadSavedInvoices(); }, [loadSavedInvoices]);

  const handleSaveToSheets = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          invoiceDate,
          dueDate,
          customerName,
          customerAddress,
          customerEmail,
          customerPhone,
          items,
          subtotal,
          tax,
          total,
          paymentStatus: "draft",
          notes,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSaveMessage(`[OK] Invoice tersimpan ke Google Sheets (id: ${json.invoice?.id?.slice(-8) || "ok"}).`);
        await loadSavedInvoices();
      } else {
        setSaveMessage(`[FAIL] Gagal: ${json.error || json.details || "Unknown error"}`);
      }
    } catch (err) {
      setSaveMessage(`[FAIL] Gagal menyimpan: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [invoiceNumber, invoiceDate, dueDate, customerName, customerAddress, customerEmail, customerPhone, items, subtotal, tax, total, notes, loadSavedInvoices]);

  /** Download visual PDF via html2canvas + jsPDF */
  const handleDownloadPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const ok = await exportElementToPDF("invoice-print", `${invoiceNumber}.pdf`);
      if (!ok) alert("Gagal mengekspor PDF. Pastikan halaman sudah ter-render.");
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal mengekspor PDF. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  }, [invoiceNumber]);

  /** Download text-based PDF via jsPDF for document generator style */
  const handleDownloadTextPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const content = [
        `INVOICE ${invoiceNumber}`,
        ``,
        `Tanggal: ${invoiceDate}`,
        `Jatuh Tempo: ${dueDate}`,
        ``,
        `Kepada: ${customerName}`,
        `${customerAddress}`,
        ``,
        `---`,
        ``,
        ...items.map((item, i) =>
          `${i + 1}. ${item.description}\n   ${item.qty} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.qty * item.unitPrice)}`
        ),
        ``,
        `---`,
        ``,
        `Subtotal: ${formatCurrency(subtotal)}`,
        `PPN 11%: ${formatCurrency(tax)}`,
        `TOTAL: ${formatCurrency(total)}`,
        ``,
        `Informasi Pembayaran:`,
        `Bank BRI — No. Rekening: 201101000546304`,
        `Atas Nama: SWI HOLDING`,
        ``,
        notes ? `Catatan: ${notes}` : ``,
      ].join("\n");

      await exportContentToPDF({
        title: `Invoice ${invoiceNumber}`,
        letterNumber: invoiceNumber,
        content,
        filename: `${invoiceNumber}.pdf`,
      });
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Gagal mengekspor PDF. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  }, [invoiceNumber, invoiceDate, dueDate, customerName, customerAddress, items, subtotal, tax, total, notes]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">📄 Invoice Template</h2>
          <p className="text-muted-foreground">Invoice profesional untuk penjualan produk SWI. Download PDF atau print langsung.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSaveToSheets}
          disabled={saving}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "⏳ Menyimpan..." : "💾 Simpan ke Google Sheets"}
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
        >
          {isExporting ? "⏳ Export..." : "📥 Download PDF (Visual)"}
        </button>
        <button
          onClick={handleDownloadTextPDF}
          disabled={isExporting}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 text-sm font-medium disabled:opacity-50"
        >
          📄 Download PDF (Text)
        </button>
        <button
          onClick={() => setShowSaved(!showSaved)}
          className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 text-sm font-medium"
        >
          📋 Tersimpan ({savedInvoices.length})
        </button>
        </div>
        {saveMessage && (
        <p className={`text-sm mt-2 ${saveMessage.startsWith("OK") ? "text-emerald-600" : "text-red-500"}`}>{saveMessage}</p>
        )}
      </div>

      {/* Invoice Paper — printable area */}
      <div className="bg-white text-black rounded-xl shadow-lg p-8 max-w-4xl mx-auto print:shadow-none print:rounded-none" id="invoice-print">
        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PT SENSAI WANGI INDONESIA</h1>
            <p className="text-sm text-gray-600 mt-1">Jl. Taman Ismail Marzuki, Jakarta Pusat</p>
            <p className="text-sm text-gray-600">Telp: +62 811-855-6688</p>
            <p className="text-sm text-gray-600">Email: sensasiwangi.id@gmail.com</p>
            <p className="text-sm text-gray-600">NPWP: 00.000.000.0-000.000</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm text-gray-600 mt-1">No: {invoiceNumber}</p>
            <p className="text-sm text-gray-600">Tanggal: {invoiceDate}</p>
            <p className="text-sm text-gray-600">Jatuh Tempo: {dueDate}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Bill To:</h3>
          <p className="font-semibold text-gray-900">{customerName}</p>
          <p className="text-sm text-gray-600">{customerAddress}</p>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 text-sm font-semibold text-gray-700">#</th>
              <th className="text-left py-2 text-sm font-semibold text-gray-700">Deskripsi</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Qty</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Harga Satuan</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2 text-sm text-gray-600">{i + 1}</td>
                <td className="py-2 text-sm text-gray-900">{item.description}</td>
                <td className="py-2 text-sm text-right text-gray-600">{item.qty}</td>
                <td className="py-2 text-sm text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(item.qty * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PPN 11%</span>
              <span className="text-gray-900">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-2">
              <span className="text-gray-900">TOTAL</span>
              <span className="text-gray-900">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Informasi Pembayaran:</h3>
          <p className="text-sm text-gray-600">Bank BRI — No. Rekening: 201101000546304</p>
          <p className="text-sm text-gray-600">Atas Nama: SWI HOLDING</p>
        </div>

        {/* Notes */}
        {notes && (
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Catatan:</h3>
            <p className="text-sm text-gray-600">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-4 mt-8 text-center">
          <p className="text-xs text-gray-500">Terima kasih atas bisnis Anda! — SWI Sensasi Wangi Indonesia</p>
          <p className="text-xs text-gray-400 mt-1">Invoice ini dibuat secara otomatis oleh systemswi</p>
        </div>
      </div>

      {/* Saved Invoices Table */}
      {showSaved && savedInvoices.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <h3 className="text-lg font-semibold">Invoice Tersimpan di Google Sheets</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2">No. Invoice</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Tanggal</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {savedInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-muted/30">
                    <td className="p-2 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="p-2">{inv.customerName}</td>
                    <td className="p-2">{inv.invoiceDate}</td>
                    <td className="p-2 text-right">{formatCurrency(inv.total)}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inv.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : inv.paymentStatus === "overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{inv.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h3 className="text-lg font-semibold">Edit Invoice</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">No. Invoice</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tanggal</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Customer</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Jatuh Tempo</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Email Customer</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Telepon Customer</label>
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Alamat Customer</label>
          <input
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Item</label>
            <button onClick={addItem} className="text-sm text-primary hover:underline">+ Tambah Item</button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-12 items-end">
                <div className="md:col-span-5">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Nama produk"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
                    placeholder="Qty"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                    placeholder="Harga"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <span className="text-sm font-medium flex-1 text-right">{formatCurrency(item.qty * item.unitPrice)}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Catatan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          />
        </div>

        {/* Summary */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span>PPN 11%</span><span>{formatCurrency(tax)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-2"><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
        </div>
      </div>
    </div>
  );
}
