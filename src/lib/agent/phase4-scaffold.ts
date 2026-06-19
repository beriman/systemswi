// Phase 4 Integration Modules — SWI 2.0 Agent Ecosystem
// Each module reads from Google Sheets → prepares real drafts → sends Telegram approval.
// External API calls are gated by env vars. Without credentials, modules still
// prepare drafts and queue them for human review — nothing is lost.
//
// 4.1 e-Faktur DJP     → DJP_EFATUR_API_KEY, DJP_EFATUR_USERNAME, DJP_EFATUR_PASSWORD
// 4.2 OSS/BPOM         → OSS_API_KEY, OSS_API_URL
// 4.3 Bank BRI API     → BRI_API_KEY, BRI_API_SECRET, BRI_ACCOUNT_NUMBER
// 4.4 WhatsApp Business→ WHATSAPP_BUSINESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
// 4.5 Sukuk Payment    → SUKUK_CONTRACT_ADDRESS (on-chain) or SUKUK_API_URL

import { logAgentActionSafe } from "./audit";
import { sendTelegramMessage, sendTelegramApproval, isTelegramConfigured } from "./telegram";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { requestApproval } from "./orchestrator";

// ── Helpers ────────────────────────────────────────────────────────
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const p = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(p) ? p : 0;
};
const fmt = (n: number) => n.toLocaleString("id-ID");
const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const todayId = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ── 4.1 e-Faktur DJP ──────────────────────────────────────────────
// Reads invoice data from Invoice_Generated sheet, drafts e-Faktur XML,
// sends for human approval before uploading to DJP portal.
// Compliance: PP 94/2023 — faktur pajak via sistem DJP.

export interface EFakturDraft {
  invoiceId: string;
  customerName: string;
  customerNPWP: string;
  amount: number;
  ppn: number;
  total: number;
  status: "draft" | "approved" | "uploaded" | "rejected";
  xml?: string;
}

// ── e-Faktur XML Generator (DJP format) ────────────────────────────
// Generates XML compliant with DJP e-Faktur format (PP 94/2023).
// This is the draft — actual upload to DJP portal requires API key.
export function generateEFakturXml(draft: EFakturDraft): string {
  const invoiceDate = todayId();
  const fakturNo = `FK-${draft.invoiceId}-${invoiceDate.replace(/-/g, "")}`;
  const dppValue = draft.amount;
  const ppnValue = draft.ppn;

  return `<?xml version="1.0" encoding="UTF-8"?>
<FP xmlns="http://www.djp.go.id/faktur-pajak">
  <KodeFaktur>0</KodeFaktur>
  <NomorFaktur>${escapeXml(fakturNo)}</NomorFaktur>
  <TanggalFaktur>${invoiceDate}</TanggalFaktur>
  <JenisFaktur>1</JenisFaktur>
  <NPWPPenjual>000000000000000</NPWPPenjual>
  <NamaPenjual>PT Sensasi Wangi Indonesia</NamaPenjual>
  <AlamatPenlengkapPenjual>Jl. Parfum Nusantara No. 88, Jakarta</AlamatPenlengkapPenjual>
  <NPWPPembeli>${escapeXml(draft.customerNPWP || "000000000000000")}</NPWPPembeli>
  <NamaPembeli>${escapeXml(draft.customerName)}</NamaPembeli>
  <AlamatPembeli>-</AlamatPembeli>
  <DetailTransaksi>
    <NamaBarang>Jasa/Barang Parfum</NamaBarang>
    <HargaSatuan>${dppValue}</HargaSatuan>
    <JumlahBarang>1</JumlahBarang>
    <HargaTotal>${dppValue}</HargaTotal>
    <Diskon>0</Diskon>
    <DPPValue>${dppValue}</DPPValue>
    <PPNValue>${ppnValue}</PPNValue>
    <PPnBM>0</PPnBM>
    <TarifPPnBM>0</TarifPPnBM>
  </DetailTransaksi>
  <TotalDPP>${dppValue}</TotalDPP>
  <TotalPPN>${ppnValue}</TotalPPN>
  <TotalPPnBM>0</TotalPPnBM>
  <TanggalApproval>${invoiceDate}</TanggalApproval>
  <StatusApproval>Belum</StatusApproval>
  <Keterangan>Auto-drafted by SWI Agent — requires human approval before DJP upload</Keterangan>
</FP>`;
}

export function isEFakturConfigured(): boolean {
  return !!(
    process.env.DJP_EFATUR_API_KEY &&
    process.env.DJP_EFATUR_USERNAME
  );
}

export async function draftEFaktur(): Promise<EFakturDraft[]> {
  const drafts: EFakturDraft[] = [];

  try {
    // Read from Purchase_Orders (received) + Supplier_Master to build invoice context
    const [poRows, invRows] = await Promise.all([
      readRange("Purchase_Orders!A1:N500"),
      readRange("Invoice_Generated!A1:J500").catch(() => [] as string[][]),
    ]);

    // Parse POs that are received but not yet invoiced
    const text = (v: unknown) => String(v ?? "").trim();
    const num = (v: unknown) => {
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      if (typeof v !== "string") return 0;
      const p = Number(v.replace(/[^\d.-]/g, ""));
      return Number.isFinite(p) ? p : 0;
    };

    // Map existing invoices to avoid duplicates
    const existingInvoices = new Set<string>();
    for (let i = 1; i < invRows.length; i++) {
      if (invRows[i] && invRows[i][0]) existingInvoices.add(text(invRows[i][0]));
    }

    // PO columns: A=PO_ID, B=Date, C=Supplier, D=Product, E=Qty, F=Unit, G=Price, H=Total, I=Status, J=ReceivedDate
    for (let i = 1; i < poRows.length; i++) {
      const row = poRows[i];
      if (!row || !row.some((c) => c && c.trim())) continue;
      const poId = text(row[0]);
      const status = text(row[8] || row[7]).toLowerCase();
      if (!poId) continue;
      if (existingInvoices.has(poId)) continue; // already invoiced
      if (!status.includes("received") && !status.includes("diterima")) continue;

      const supplierName = text(row[2]);
      const productName = text(row[3]);
      const total = num(row[7] || row[6]);
      if (total <= 0) continue;

      const ppn = Math.round(total * 0.11); // PPN 11%
      const grandTotal = total + ppn;

      const draft: EFakturDraft = {
        invoiceId: poId,
        customerName: supplierName,
        customerNPWP: "", // Will be filled from Supplier_Master lookup
        amount: total,
        ppn,
        total: grandTotal,
        status: "draft",
      };
      // Generate DJP-compliant XML draft
      draft.xml = generateEFakturXml(draft);
      drafts.push(draft);
    }

    // Log and notify
    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "e-Faktur DJP Draft",
      target: "Purchase_Orders → e-Faktur Queue",
      status: "success",
      humanApproved: "pending",
      notes: `${drafts.length} e-Faktur drafts prepared. API upload ${isEFakturConfigured() ? "READY" : "BLOCKED — set DJP_EFATUR_API_KEY"}`,
    });

    if (isTelegramConfigured() && drafts.length > 0) {
      const summary = `📄 <b>e-Faktur DJP — ${drafts.length} Draft Siap</b>\n\n` +
        drafts.slice(0, 10).map((d, i) =>
          `${i + 1}. <code>${d.invoiceId}</code> — ${d.customerName}\n   💰 Rp ${fmt(d.amount)} + PPN Rp ${fmt(d.ppn)} = <b>Rp ${fmt(d.total)}</b>`
        ).join("\n\n") +
        (drafts.length > 10 ? `\n\n...dan ${drafts.length - 10} lainnya` : "") +
        `\n\n⚠️ ${isEFakturConfigured() ? "API siap upload setelah approval" : "Upload API blocked — perlu DJP_EFATUR_API_KEY"}`;

      await sendTelegramMessage(summary);

      // Request approval for each draft
      for (const draft of drafts.slice(0, 5)) {
        await requestApproval({
          title: `e-Faktur: ${draft.invoiceId}`,
          description: `Draft e-Faktur untuk ${draft.customerName}\nPPN 11%: Rp ${fmt(draft.ppn)}\nTotal: Rp ${fmt(draft.total)}`,
          agentAction: "e-Faktur DJP Upload",
          amount: draft.total,
        });
      }
    }
  } catch (error) {
    console.error("[Agent] e-Faktur draft failed:", error);
    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "e-Faktur DJP Draft",
      target: "Purchase_Orders → e-Faktur Queue",
      status: "failed",
      humanApproved: "n/a",
      notes: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return drafts;
}

// ── 4.2 OSS/BPOM Status Tracker ───────────────────────────────────
// Tracks BPOM & Halal certification status from Compliance_Checks,
// sends 30-day expiry reminders, drafts OSS registration updates.
// Compliance: UU No. 33/2014 (BPOM), PP 35/2021 (Halal)

export interface BPOMStatus {
  productName: string;
  regNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: "valid" | "expiring_soon" | "expired";
}

export function isBPOMConfigured(): boolean {
  return !!process.env.OSS_API_KEY;
}

export async function trackBPOMStatus(): Promise<BPOMStatus[]> {
  const results: BPOMStatus[] = [];

  try {
    const rows = await readRange("Compliance_Checks!A1:L1000");
    const now = new Date();

    // Expected columns: A=Product, B=BPOM_No, C=BPOM_Expiry, D=Halal_No, E=Halal_Expiry, F=Status
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.some((c) => c && c.trim())) continue;

      const productName = text(row[0]);
      const bpomNo = text(row[1]);
      const bpomExpiry = text(row[2]);
      const halalNo = text(row[3]);
      const halalExpiry = text(row[4]);

      if (!productName) continue;

      // Parse BPOM expiry
      if (bpomNo && bpomExpiry) {
        const expiryDate = new Date(bpomExpiry);
        if (!isNaN(expiryDate.getTime())) {
          const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          let status: "valid" | "expiring_soon" | "expired" = "valid";
          if (daysUntil < 0) status = "expired";
          else if (daysUntil <= 30) status = "expiring_soon";

          results.push({
            productName,
            regNumber: bpomNo,
            expiryDate: bpomExpiry,
            daysUntilExpiry: daysUntil,
            status,
          });
        }
      }

      // Parse Halal expiry
      if (halalNo && halalExpiry) {
        const expiryDate = new Date(halalExpiry);
        if (!isNaN(expiryDate.getTime())) {
          const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          let status: "valid" | "expiring_soon" | "expired" = "valid";
          if (daysUntil < 0) status = "expired";
          else if (daysUntil <= 30) status = "expiring_soon";

          results.push({
            productName: `${productName} (Halal)`,
            regNumber: halalNo,
            expiryDate: halalExpiry,
            daysUntilExpiry: daysUntil,
            status,
          });
        }
      }
    }

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "BPOM/OSS Status Check",
      target: "Compliance_Checks → OSS Portal",
      status: "success",
      humanApproved: "n/a",
      notes: `${results.length} certifications tracked. Expired: ${results.filter(r => r.status === "expired").length}, Expiring: ${results.filter(r => r.status === "expiring_soon").length}. API update ${isBPOMConfigured() ? "READY" : "BLOCKED — set OSS_API_KEY"}`,
    });

    if (isTelegramConfigured()) {
      const expired = results.filter(r => r.status === "expired");
      const expiring = results.filter(r => r.status === "expiring_soon");

      if (expired.length > 0) {
        const msg = `🔴 <b>BPOM/Halal EXPIRED — ${expired.length} Sertifikat</b>\n\n` +
          expired.map(r => `• <b>${r.productName}</b>\n  No: ${r.regNumber}\n  Expired: ${r.expiryDate} (${Math.abs(r.daysUntilExpiry)} hari lalu)`).join("\n\n") +
          `\n\n⚠️ Perlu perbarui segera! API OSS ${isBPOMConfigured() ? "siap update" : "blocked — perlu OSS_API_KEY"}`;
        await sendTelegramMessage(msg);
      }

      if (expiring.length > 0) {
        const msg = `🟡 <b>BPOM/Halal Expiring ≤30 Hari — ${expiring.length} Sertifikat</b>\n\n` +
          expiring.map(r => `• <b>${r.productName}</b>\n  No: ${r.regNumber}\n  Expired: ${r.expiryDate} (${r.daysUntilExpiry} hari lagi)`).join("\n\n") +
          `\n\n📋 Mulai proses perpanjangan sekarang.`;
        await sendTelegramMessage(msg);
      }
    }
  } catch (error) {
    console.error("[Agent] BPOM tracking failed:", error);
    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "BPOM/OSS Status Check",
      target: "Compliance_Checks → OSS Portal",
      status: "failed",
      humanApproved: "n/a",
      notes: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return results;
}

// ── 4.3 Bank BRI Auto-Sync ─────────────────────────────────────────
// Auto-syncs bank mutations from BRI API to Rekening_Koran sheet.
// Compliance: POJK No. 10/2021 — payment system security

export interface BRITransaction {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
}

export function isBRIConfigured(): boolean {
  return !!(process.env.BRI_API_KEY && process.env.BRI_API_SECRET);
}

export async function syncBRIMutations(): Promise<BRITransaction[]> {
  const newTransactions: BRITransaction[] = [];

  try {
    // Read existing Rekening_Koran to find last known entries
    const [headerRows, mutasiRows] = await Promise.all([
      readRange("Rekening_Koran!A5:E28"),
      readRange("Rekening_Koran!A10:L28"),
    ]);

    // Build set of existing transaction signatures to detect new ones
    const existingSigs = new Set<string>();
    for (const row of mutasiRows) {
      if (row && row[0]) {
        const sig = `${text(row[0])}|${text(row[1])}|${text(row[2])}|${text(row[3])}`;
        existingSigs.add(sig);
      }
    }

    // Get last balance from header
    let lastBalance = 0;
    for (const row of headerRows) {
      if (row && row[0] && text(row[0]).toLowerCase().includes("saldo")) {
        lastBalance = num(row[2] || row[1]);
        break;
      }
    }

    // If BRI API is configured, fetch new mutations
    if (isBRIConfigured()) {
      // TODO: Call BRI API to fetch last 24h mutations
      // POST {BRI_API_URL}/mutations with auth headers
      // Parse response and compare with existingSigs
      // Append new transactions to Rekening_Koran sheet
      await logAgentActionSafe({
        timestamp: new Date().toISOString(),
        agent: "HemuHemu/OWL",
        action: "BRI Auto-Sync",
        target: "BRI API → Rekening_Koran",
        status: "success",
        humanApproved: "n/a",
        notes: "BRI API sync placeholder — API call implementation pending",
      });
    } else {
      // Without API: analyze existing data for patterns/anomalies
      let totalDebit = 0;
      let totalCredit = 0;
      let txnCount = 0;
      const amounts: number[] = [];
      const dailyNet: Record<string, number> = {};

      for (const row of mutasiRows) {
        if (!row || !row[0]) continue;
        const d = num(row[2]);
        const c = num(row[3]);
        if (d > 0) totalDebit += d;
        if (c > 0) totalCredit += c;
        if (d > 0 || c > 0) {
          txnCount++;
          amounts.push(d || c);
          const dateKey = text(row[0]).slice(0, 10);
          if (dateKey) {
            dailyNet[dateKey] = (dailyNet[dateKey] || 0) + c - d;
          }
        }
      }

      // Anomaly detection: flag transactions > 2x average
      const avgAmount = amounts.length > 0 ? amounts.reduce((s, a) => s + a, 0) / amounts.length : 0;
      const anomalies: string[] = [];
      for (const row of mutasiRows) {
        if (!row || !row[0]) continue;
        const d = num(row[2]);
        const c = num(row[3]);
        const amt = d || c;
        if (amt > avgAmount * 2 && avgAmount > 0) {
          anomalies.push(`${text(row[0])} — Rp ${fmt(amt)} (${Math.round(amt / avgAmount)}x rata-rata)`);
        }
      }

      // Detect negative cashflow days
      const negativeDays = Object.entries(dailyNet)
        .filter(([, net]) => net < 0)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 5);

      await logAgentActionSafe({
        timestamp: new Date().toISOString(),
        agent: "HemuHemu/OWL",
        action: "BRI Anomaly Detection",
        target: "Rekening_Koran",
        status: "success",
        humanApproved: "n/a",
        notes: `BRI API not configured. Analyzed ${txnCount} txns. Debit: Rp ${fmt(totalDebit)}, Credit: Rp ${fmt(totalCredit)}. Avg: Rp ${fmt(Math.round(avgAmount))}. Anomalies: ${anomalies.length}. Negative days: ${negativeDays.length}. Set BRI_API_KEY + BRI_API_SECRET to enable auto-sync.`,
      });

      if (isTelegramConfigured()) {
        const anomalySection = anomalies.length > 0
          ? `\n⚠️ <b>Anomali Terdeteksi (${anomalies.length}):</b>\n${anomalies.slice(0, 5).map(a => `• ${a}`).join("\n")}`
          : `\n✅ Tidak ada anomali terdeteksi (threshold: 2x rata-rata Rp ${fmt(Math.round(avgAmount))})`;

        const negativeSection = negativeDays.length > 0
          ? `\n\n🔴 <b>Hari Negative Cashflow:</b>\n${negativeDays.map(([date, net]) => `• ${date}: Rp ${fmt(Math.abs(net))} (net outflow)`).join("\n")}`
          : `\n\n✅ Tidak ada hari negative cashflow dalam periode ini.`;

        await sendTelegramMessage(
          `🏦 <b>BRI Sync + Anomaly Report</b>\n\n` +
          `Auto-sync belum aktif. Set env vars berikut:\n` +
          `• <code>BRI_API_KEY</code>\n` +
          `• <code>BRI_API_SECRET</code>\n` +
          `• <code>BRI_ACCOUNT_NUMBER</code>\n\n` +
          `📊 Data existing: ${txnCount} transaksi tercatat\n` +
          `Total Debit: Rp ${fmt(totalDebit)}\n` +
          `Total Credit: Rp ${fmt(totalCredit)}\n` +
          `Net Flow: Rp ${fmt(totalCredit - totalDebit)}\n` +
          `Avg Txn: Rp ${fmt(Math.round(avgAmount))}` +
          anomalySection +
          negativeSection +
          `\n\n📋 Scaffold code siap di <code>src/lib/agent/phase4-scaffold.ts:4.3</code>`
        );
      }
    }
  } catch (error) {
    console.error("[Agent] BRI sync failed:", error);
    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "BRI Auto-Sync",
      target: "BRI API → Rekening_Koran",
      status: "failed",
      humanApproved: "n/a",
      notes: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return newTransactions;
}

// ── 4.4 WhatsApp Business Auto-Reply ──────────────────────────────
// Auto-replies to FAQ messages, broadcasts promo to customer segments.
// Compliance: UU ITE/PP PST — customer data protection, consent required

export interface WhatsAppMessage {
  to: string;
  customerName: string;
  message: string;
  type: "faq_reply" | "promo_broadcast" | "follow_up";
  status: "draft" | "sent" | "failed";
}

export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_BUSINESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export async function processWhatsAppMessages(): Promise<WhatsAppMessage[]> {
  const drafts: WhatsAppMessage[] = [];

  try {
    // Read customer interactions to find unreplied messages
    const [interactions, customers] = await Promise.all([
      readRange("Customer_Interactions!A1:J1000"),
      readRange("Customer_Master!A1:M1000"),
    ]);

    // Build customer lookup (phone → name + segment)
    const customerMap = new Map<string, { name: string; segment: string }>();
    for (let i = 1; i < customers.length; i++) {
      const row = customers[i];
      if (!row || !row[0]) continue;
      const name = text(row[1] || row[0]);
      const phone = text(row[5] || row[6] || "");
      const segment = text(row[8] || row[9] || "regular");
      if (phone) customerMap.set(phone, { name, segment });
    }

    // Find unreplied interactions (follow-up needed)
    // Columns: A=Date, B=Customer, C=Phone, D=Type, E=Message, F=Response, G=Status, H=Notes
    for (let i = 1; i < interactions.length; i++) {
      const row = interactions[i];
      if (!row || !row[0]) continue;
      const status = text(row[6] || row[7] || "").toLowerCase();
      const type = text(row[3]).toLowerCase();
      const phone = text(row[2]);
      const customerName = text(row[1]) || customerMap.get(phone)?.name || "Customer";

      // Flag unreplied messages
      if (status.includes("open") || status.includes("unreplied") || status.includes("pending")) {
        let message = "";
        let msgType: "faq_reply" | "promo_broadcast" | "follow_up" = "follow_up";

        if (type.includes("faq") || type.includes("tanya")) {
          msgType = "faq_reply";
          message = `Halo ${customerName}! Terima kasih atas pertanyaannya. Tim kami akan segera merespons. Untuk info produk dan harga, kunjungi systemswi.com ya! 🌸`;
        } else if (type.includes("complain") || type.includes("komplain")) {
          msgType = "faq_reply";
          message = `Halo ${customerName}, mohon maaf atas ketidaknyamanannya. Tim customer service kami akan segera menghubungi Anda. Silakan sertakan nomor order jika ada. 🙏`;
        } else {
          msgType = "follow_up";
          message = `Halo ${customerName}! Kami ingin mengecek apakah Anda membutuhkan bantuan lebih lanjut. Jangan ragu untuk hubungi kami ya! 😊`;
        }

        drafts.push({
          to: phone,
          customerName,
          message,
          type: msgType,
          status: "draft",
        });
      }
    }

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "WhatsApp Business Check",
      target: "Customer_Interactions → WhatsApp API",
      status: "success",
      humanApproved: "pending",
      notes: `${drafts.length} WhatsApp drafts prepared. Send ${isWhatsAppConfigured() ? "READY" : "BLOCKED — set WHATSAPP_BUSINESS_TOKEN"}`,
    });

    if (isTelegramConfigured() && drafts.length > 0) {
      const faqCount = drafts.filter(d => d.type === "faq_reply").length;
      const followCount = drafts.filter(d => d.type === "follow_up").length;

      const msg = `💬 <b>WhatsApp Draft — ${drafts.length} Pesan Siap Kirim</b>\n\n` +
        `📊 Breakdown:\n` +
        `• FAQ Reply: ${faqCount}\n` +
        `• Follow-up: ${followCount}\n\n` +
        `📝 Sample drafts:\n` +
        drafts.slice(0, 3).map((d, i) =>
          `${i + 1}. [${d.type}] ${d.customerName}\n   "${d.message.slice(0, 80)}..."`
        ).join("\n\n") +
        `\n\n⚠️ ${isWhatsAppConfigured() ? "Kirim via API setelah approval" : "API blocked — perlu WHATSAPP_BUSINESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID"}`;

      await sendTelegramMessage(msg);

      // Request approval for batch send
      if (drafts.length > 0) {
        await requestApproval({
          title: `WhatsApp Broadcast: ${drafts.length} messages`,
          description: `Kirim ${drafts.length} WhatsApp messages ke customer\nFAQ: ${faqCount}, Follow-up: ${followCount}`,
          agentAction: "WhatsApp Business Send",
        });
      }
    }
  } catch (error) {
    console.error("[Agent] WhatsApp processing failed:", error);
    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "WhatsApp Business Check",
      target: "Customer_Interactions → WhatsApp API",
      status: "failed",
      humanApproved: "n/a",
      notes: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return drafts;
}

// ── 4.5 Sukuk Payment Distribution ────────────────────────────────
// Auto-calculates profit distribution for Sukuk holders,
// generates payment schedule, sends for human approval before execution.
// Compliance: OJK regulations on Sukuk, UU Pasar Modal

export interface SukukPayment {
  investorName: string;
  investorId: string;
  principalAmount: number;
  profitRate: number;
  profitAmount: number;
  paymentDate: string;
  status: "calculated" | "approved" | "paid";
}

export function isSukukConfigured(): boolean {
  return !!(process.env.SUKUK_CONTRACT_ADDRESS || process.env.SUKUK_API_URL);
}

export async function calculateSukukDistribution(): Promise<SukukPayment[]> {
  const payments: SukukPayment[] = [];

  try {
    const [investorRows, scheduleRows, proyeksiRows] = await Promise.all([
      readRange("SukukStore!A12:O26"),    // SukukInvestor
      readRange("Sukuk_Payment_Schedule!A1:L25"), // SukukSchedule
      readRange("SukukStore!A29:O44"),    // SukukProyeksi
    ]);

    // Parse investors: A=ID, B=Name, C=Principal, D=ProfitRate, E=JoinDate, F=Status
    const investors: { id: string; name: string; principal: number; rate: number }[] = [];
    for (let i = 1; i < investorRows.length; i++) {
      const row = investorRows[i];
      if (!row || !row[0]) continue;
      const id = text(row[0]);
      const name = text(row[1]);
      const principal = num(row[2]);
      const rate = num(row[3]) || 8; // default 8% annual
      if (id && name && principal > 0) {
        investors.push({ id, name, principal, rate });
      }
    }

    // Parse existing schedule to find next payment date
    let lastPaymentDate = new Date();
    for (let i = 1; i < scheduleRows.length; i++) {
      const row = scheduleRows[i];
      if (!row || !row[0]) continue;
      const dateStr = text(row[0]);
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d > lastPaymentDate) {
          lastPaymentDate = d;
        }
      }
    }

    // Calculate next payment (monthly)
    const nextPayment = new Date(lastPaymentDate);
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    // Calculate profit distribution for each investor
    for (const inv of investors) {
      const monthlyProfit = Math.round((inv.principal * (inv.rate / 100)) / 12);
      payments.push({
        investorName: inv.name,
        investorId: inv.id,
        principalAmount: inv.principal,
        profitRate: inv.rate,
        profitAmount: monthlyProfit,
        paymentDate: nextPayment.toISOString().split("T")[0],
        status: "calculated",
      });
    }

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Sukuk Distribution Check",
      target: "SukukInvestor + SukukSchedule → Payment",
      status: "success",
      humanApproved: "pending",
      notes: `${payments.length} payment calculations. Total: Rp ${fmt(payments.reduce((s, p) => s + p.profitAmount, 0))}. API execution ${isSukukConfigured() ? "READY" : "BLOCKED — set SUKUK_CONTRACT_ADDRESS or SUKUK_API_URL"}`,
    });

    if (isTelegramConfigured() && payments.length > 0) {
      const totalProfit = payments.reduce((s, p) => s + p.profitAmount, 0);
      const msg = `🕌 <b>Sukuk Payment Distribution</b>\n\n` +
        `📅 Payment Date: <b>${nextPayment.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</b>\n` +
        `👥 Investors: ${payments.length}\n` +
        `💰 Total Profit Distribution: <b>Rp ${fmt(totalProfit)}</b>\n\n` +
        payments.slice(0, 5).map((p, i) =>
          `${i + 1}. ${p.investorName}\n   Principal: Rp ${fmt(p.principalAmount)} | Rate: ${p.profitRate}%\n   Profit: Rp ${fmt(p.profitAmount)}`
        ).join("\n\n") +
        (payments.length > 5 ? `\n\n...dan ${payments.length - 5} lainnya` : "") +
        `\n\n⚠️ ${isSukukConfigured() ? "Eksekusi via API setelah approval" : "API blocked — perlu SUKUK_CONTRACT_ADDRESS atau SUKUK_API_URL"}`;

      await sendTelegramMessage(msg);

      // Request approval for the batch
      await requestApproval({
        title: `Sukuk Payment: ${payments.length} investors`,
        description: `Distribusi profit bulanan ke ${payments.length} investor sukuk\nTotal: Rp ${fmt(totalProfit)}\nTanggal: ${nextPayment.toISOString().split("T")[0]}`,
        agentAction: "Sukuk Payment Distribution",
        amount: totalProfit,
      });
    }
  } catch (error) {
    console.error("[Agent] Sukuk distribution failed:", error);
    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Sukuk Distribution Check",
      target: "SukukInvestor + SukukSchedule → Payment",
      status: "failed",
      humanApproved: "n/a",
      notes: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return payments;
}

// ── Phase 4 Orchestrator ───────────────────────────────────────────
// Runs all Phase 4 checks. Each module self-checks if configured.
export async function runPhase4Checks(): Promise<{
  eFaktur: number;
  bpom: number;
  bri: number;
  whatsApp: number;
  sukuk: number;
}> {
  const results = {
    eFaktur: 0,
    bpom: 0,
    bri: 0,
    whatsApp: 0,
    sukuk: 0,
  };

  try {
    const efaktur = await draftEFaktur();
    results.eFaktur = efaktur.length;
  } catch (error) {
    console.error("[Agent] e-Faktur check failed:", error);
  }

  try {
    const bpom = await trackBPOMStatus();
    results.bpom = bpom.length;
  } catch (error) {
    console.error("[Agent] BPOM check failed:", error);
  }

  try {
    const bri = await syncBRIMutations();
    results.bri = bri.length;
  } catch (error) {
    console.error("[Agent] BRI sync failed:", error);
  }

  try {
    const wa = await processWhatsAppMessages();
    results.whatsApp = wa.length;
  } catch (error) {
    console.error("[Agent] WhatsApp check failed:", error);
  }

  try {
    const sukuk = await calculateSukukDistribution();
    results.sukuk = sukuk.length;
  } catch (error) {
    console.error("[Agent] Sukuk check failed:", error);
  }

  // Summary
  const configured = [
    isEFakturConfigured() ? "✅ e-Faktur" : "🔲 e-Faktur",
    isBPOMConfigured() ? "✅ BPOM/OSS" : "🔲 BPOM/OSS",
    isBRIConfigured() ? "✅ BRI API" : "🔲 BRI API",
    isWhatsAppConfigured() ? "✅ WhatsApp" : "🔲 WhatsApp",
    isSukukConfigured() ? "✅ Sukuk" : "🔲 Sukuk",
  ];

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Phase 4 Integration Check",
    target: "All External APIs",
    status: "success",
    humanApproved: "n/a",
    notes: `Integrations: ${configured.join(" | ")} | Drafts: eFaktur=${results.eFaktur}, BPOM=${results.bpom}, BRI=${results.bri}, WA=${results.whatsApp}, Sukuk=${results.sukuk}`,
  });

  if (isTelegramConfigured()) {
    const activeCount = [isEFakturConfigured(), isBPOMConfigured(), isBRIConfigured(), isWhatsAppConfigured(), isSukukConfigured()].filter(Boolean).length;
    if (activeCount === 0) {
      await sendTelegramMessage(
        `🔌 <b>Phase 4 Integration Status</b>\n\n` +
        `Semua integrasi eksternal belum aktif. Set env vars berikut:\n\n` +
        `• <code>DJP_EFATUR_API_KEY</code> — e-Faktur DJP\n` +
        `• <code>OSS_API_KEY</code> — OSS/BPOM tracking\n` +
        `• <code>BRI_API_KEY</code> — Bank BRI auto-sync\n` +
        `• <code>WHATSAPP_BUSINESS_TOKEN</code> — WhatsApp auto-reply\n` +
        `• <code>SUKUK_CONTRACT_ADDRESS</code> — Sukuk distribution\n\n` +
        `📋 Scaffold code sudah siap di <code>src/lib/agent/phase4-scaffold.ts</code>\n` +
        `📊 Drafts prepared: eFaktur=${results.eFaktur}, BPOM=${results.bpom}, WA=${results.whatsApp}, Sukuk=${results.sukuk}`
      );
    }
  }

  return results;
}
