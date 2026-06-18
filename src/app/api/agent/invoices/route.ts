// GET /api/agent/invoices — Generate and return invoice drafts from POs
// POST /api/agent/invoices — Generate + send summary via Telegram for approval
import { NextRequest, NextResponse } from "next/server";
import {
  generateInvoices,
  formatInvoiceForTelegram,
  formatInvoiceSummaryForTelegram,
  sendTelegramMessage,
  sendTelegramApproval,
  isTelegramConfigured,
} from "@/lib/agent";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await generateInvoices();
    return NextResponse.json({
      ...result,
      source: "Google Sheets: Purchase_Orders + Supplier_Master + Customer_Master",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate invoices", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sendToTelegram = body.sendToTelegram !== false; // default true

    const result = await generateInvoices();
    let telegramSent = false;
    let approvalRequested = false;

    if (isTelegramConfigured() && sendToTelegram && result.invoices.length > 0) {
      // Send summary first
      const summaryText = formatInvoiceSummaryForTelegram(result);
      await sendTelegramMessage(summaryText);
      telegramSent = true;

      // Request approval for each invoice (up to 10 to avoid spam)
      const invoicesToApprove = result.invoices
        .filter((inv: { status: string }) => inv.status === "draft")
        .sort((a: { grandTotal: number }, b: { grandTotal: number }) => b.grandTotal - a.grandTotal)
        .slice(0, 10);

      for (const inv of invoicesToApprove) {
        await sendTelegramApproval({
          approvalId: inv.id,
          title: `Invoice: ${inv.invoiceNumber}`,
          description: `${inv.type === "vendor" ? "Vendor" : "Customer"} — ${inv.partyName}\n${inv.items.length} item(s)\nSubtotal: Rp ${inv.subtotal.toLocaleString("id-ID")}\nPPN: Rp ${inv.taxAmount.toLocaleString("id-ID")}`,
          amount: inv.grandTotal,
          agentAction: `Send ${inv.type} invoice ${inv.invoiceNumber} to ${inv.partyName}`,
        });
      }

      if (invoicesToApprove.length > 0) {
        approvalRequested = true;
      }
    }

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Invoice Generation",
      target: "Purchase_Orders + Supplier_Master + Customer_Master",
      status: "success",
      humanApproved: "pending",
      notes: `Generated ${result.summary.totalDrafted} invoices, ${result.summary.pendingApproval} pending approval. Telegram: ${telegramSent}`,
    });

    return NextResponse.json({
      ...result,
      telegramSent,
      approvalRequested,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate invoices", details: String(error) },
      { status: 500 }
    );
  }
}
