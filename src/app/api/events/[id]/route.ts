// GET /api/events/[id] — Get single event details (budget, tenants, sponsors, timeline)
import { NextRequest, NextResponse } from "next/server";
import { readEventSheet, EVENT_SHEETS } from "@/lib/event/sheets";
import { readExpenseSheet, EXPENSE_SHEETS } from "@/lib/expense/sheets";
import { readSheet } from "@/lib/sheets/sheets-real";

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isPaidStatus(value: string): boolean {
  return ["paid", "lunas", "settled", "completed", "received"].includes(value.toLowerCase().trim());
}

function isApprovedExpenseStatus(value: string): boolean {
  return ["approved", "paid", "lunas", "settled", "completed", "submitted"].includes(value.toLowerCase().trim());
}

function isPayableExpenseStatus(value: string): boolean {
  return ["pending", "needs proof", "butuh bukti", "approved"].includes(value.toLowerCase().trim());
}

function isOpenPoStatus(value: string): boolean {
  return ["draft", "ordered", "partial"].includes(value.toLowerCase().trim());
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Next.js 16: params is a Promise
) {
  try {
    const { id } = await params;

    // Fetch all related data in parallel
    const [events, budget, tenants, sponsors, timeline, media, expenses, governanceAuditLog, purchaseOrders] = await Promise.all([
      readEventSheet(EVENT_SHEETS.Events).catch(() => []),
      readEventSheet(EVENT_SHEETS.Budget).catch(() => []),
      readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
      readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
      readEventSheet(EVENT_SHEETS.Timeline).catch(() => []),
      readEventSheet(EVENT_SHEETS.Media).catch(() => []),
      readExpenseSheet(EXPENSE_SHEETS.Submissions).catch(() => []),
      readSheet("GovernanceAuditLog").catch(() => []),
      readSheet("PurchaseOrders").catch(() => []),
    ]);

    // Find the event
    const eventRow = events.slice(1).find((r) => r[0] === id);
    if (!eventRow) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = {
      id: eventRow[0],
      name: eventRow[1],
      slug: eventRow[2],
      type: eventRow[3],
      status: eventRow[4],
      description: eventRow[5],
      pic: eventRow[6],
      instagram: eventRow[7],
      startDate: eventRow[8],
      endDate: eventRow[9],
      location: eventRow[10],
      venue: eventRow[11],
      budget: parseFloat(eventRow[12] || "0") || 0,
      actualCost: parseFloat(eventRow[13] || "0") || 0,
      revenue: parseFloat(eventRow[14] || "0") || 0,
      tenantCount: parseInt(eventRow[15] || "0") || 0,
      sponsorCount: parseInt(eventRow[16] || "0") || 0,
      attendeeTarget: parseInt(eventRow[17] || "0") || 0,
      attendeeActual: parseInt(eventRow[18] || "0") || 0,
      notes: eventRow[19] || "",
      created: eventRow[20] || "",
      updated: eventRow[21] || "",
    };

    // Filter related data
    const eventBudget = budget.slice(1).filter((r) => r[1] === id).map((r) => ({
      id: r[0], category: r[2], itemName: r[3],
      plannedAmount: parseFloat(r[4] || "0") || 0,
      actualAmount: parseFloat(r[5] || "0") || 0,
      notes: r[6] || "", created: r[7] || "",
    }));

    const eventTenants = tenants.slice(1).filter((r) => r[1] === id).map((r) => ({
      id: r[0], brandName: r[2], contactPerson: r[3], email: r[4], phone: r[5],
      boothNumber: r[6], boothSize: r[7], packageType: r[8],
      fee: parseFloat(r[9] || "0") || 0,
      paymentStatus: r[10], paymentAmount: parseFloat(r[11] || "0") || 0,
      contractDate: r[12], notes: r[13] || "", created: r[14] || "",
    }));

    const eventSponsors = sponsors.slice(1).filter((r) => r[1] === id).map((r) => ({
      id: r[0], companyName: r[2], contactPerson: r[3], email: r[4], phone: r[5],
      tier: r[6], sponsorshipAmount: parseFloat(r[7] || "0") || 0,
      inKind: r[8] === "true", inKindDescription: r[9],
      inKindValue: parseFloat(r[10] || "0") || 0,
      paymentStatus: r[11], contractDate: r[12],
      logoUrl: r[13], notes: r[14] || "", created: r[15] || "",
    }));

    const eventTimeline = timeline.slice(1).filter((r) => r[1] === id).map((r) => ({
      id: r[0], phase: r[2], milestone: r[3], dueDate: r[4],
      completed: r[5] === "true", completedDate: r[6], notes: r[7] || "", created: r[8] || "",
    }));

    const eventMedia = media.slice(1).filter((r) => r[1] === id).map((r) => ({
      id: r[0] || "",
      type: r[2] || "other",
      title: r[3] || "",
      url: r[4] || "",
      caption: r[5] || "",
      source: r[6] || "manual",
      featured: r[7] || "false",
      created: r[9] || "",
    }));

    const eventExpenses = expenses.slice(1).filter((r) => r[3] === id || r[3] === event.name).map((r) => ({
      id: r[0] || "",
      date: r[1] || "",
      submitterName: r[2] || "",
      category: r[4] || "Belum dicatat",
      description: r[5] || "",
      amount: parseAmount(r[6]),
      proofUrl: r[7] || "",
      status: r[8] || "Belum dicatat",
      division: r[12] || "Belum dicatat",
      paymentMethod: r[14] || "Belum dicatat",
      shareholderDebtFlag: ["yes", "ya", "true", "1"].includes(String(r[17] || "").toLowerCase().trim()),
    }));

    const eventExpenseIds = new Set(eventExpenses.map((item) => item.id).filter(Boolean));
    const eventMatchTokens = [id, event.name, event.slug].map((value) => text(value).toLowerCase()).filter(Boolean);
    const eventPurchaseOrders = purchaseOrders.slice(1).filter((r) => {
      const haystack = [r[0], r[3], r[4], r[5], r[13]].map((value) => text(value).toLowerCase()).join(" ");
      return eventMatchTokens.some((token) => haystack.includes(token));
    }).map((r) => ({
      id: r[0] || "",
      date: r[1] || "",
      supplierName: r[3] || "Belum dicatat",
      itemName: r[5] || "Belum dicatat",
      total: parseAmount(r[9]),
      status: r[10] || "Belum dicatat",
      expectedDate: r[11] || "TBA",
      proofUrl: r[12] || "",
      notes: r[13] || "",
    }));
    const governanceAuditTrail = governanceAuditLog.slice(1)
      .filter((r) => {
        const entityType = String(r[5] || "").toLowerCase().trim();
        const entityId = String(r[6] || "").trim();
        const reason = String(r[11] || "").toLowerCase();
        const sourceModule = String(r[13] || "").toLowerCase();
        const eventName = String(event.name || "").toLowerCase();
        return entityId === id
          || entityId === event.name
          || eventExpenseIds.has(entityId)
          || (entityType === "event" && reason.includes(id.toLowerCase()))
          || (sourceModule.includes("/events") && (reason.includes(id.toLowerCase()) || (eventName && reason.includes(eventName))));
      })
      .map((r) => ({
        logId: r[0] || "",
        timestamp: r[1] || "",
        actor: r[2] || "Belum dicatat",
        role: r[3] || "TBA",
        action: r[4] || "TBA",
        entityType: r[5] || "TBA",
        entityId: r[6] || "TBA",
        amount: parseAmount(r[7]),
        division: r[8] || "Belum dicatat",
        before: r[9] || "",
        after: r[10] || "",
        reason: r[11] || "Belum dicatat",
        proofUrl: r[12] || "",
        sourceModule: r[13] || "TBA",
      }))
      .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));

    const plannedTotal = eventBudget.reduce((sum, item) => sum + item.plannedAmount, 0) || event.budget;
    const budgetActualTotal = eventBudget.reduce((sum, item) => sum + item.actualAmount, 0) || event.actualCost;
    const approvedExpenseTotal = eventExpenses
      .filter((item) => isApprovedExpenseStatus(item.status))
      .reduce((sum, item) => sum + item.amount, 0);
    const payableExpenseTotal = eventExpenses
      .filter((item) => isPayableExpenseStatus(item.status) && item.amount > 0 && item.paymentMethod !== "Personal Paid")
      .reduce((sum, item) => sum + item.amount, 0);
    const payablePurchaseOrderTotal = eventPurchaseOrders
      .filter((item) => isOpenPoStatus(item.status))
      .reduce((sum, item) => sum + item.total, 0);
    const actualExpenseTotal = approvedExpenseTotal || budgetActualTotal;
    const tenantRevenuePaid = eventTenants.reduce((sum, item) => sum + item.paymentAmount, 0);
    const tenantRevenueExpected = eventTenants.reduce((sum, item) => sum + item.fee, 0);
    const sponsorRevenuePaid = eventSponsors.reduce(
      (sum, item) => sum + (isPaidStatus(item.paymentStatus) ? item.sponsorshipAmount + item.inKindValue : 0),
      0
    );
    const sponsorRevenueExpected = eventSponsors.reduce((sum, item) => sum + item.sponsorshipAmount + item.inKindValue, 0);
    const revenuePaidTotal = tenantRevenuePaid + sponsorRevenuePaid || event.revenue;
    const revenueExpectedTotal = tenantRevenueExpected + sponsorRevenueExpected || event.revenue;
    const tenantReceivable = eventTenants.reduce((sum, item) => sum + Math.max(item.fee - item.paymentAmount, 0), 0);
    const sponsorReceivable = eventSponsors.reduce(
      (sum, item) => sum + (isPaidStatus(item.paymentStatus) ? 0 : item.sponsorshipAmount + item.inKindValue),
      0
    );
    const expensesWithoutProof = eventExpenses.filter((item) => item.amount > 0 && !item.proofUrl).length;
    const expensesNeedsProof = eventExpenses.filter((item) => ["needs proof", "butuh bukti"].includes(item.status.toLowerCase())).length;
    const categoryTotals = eventExpenses.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || "Belum dicatat";
      acc[key] = (acc[key] || 0) + item.amount;
      return acc;
    }, {});
    const expenseByCategory: { category: string; amount: number }[] = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount: Number(amount) || 0 }))
      .sort((a, b) => b.amount - a.amount);

    const closeoutBlockers = [
      plannedTotal <= 0 ? "Budget/RAB belum dicatat" : "",
      actualExpenseTotal <= 0 ? "Actual expense belum tercatat" : "",
      expensesWithoutProof > 0 ? `${expensesWithoutProof} expense belum punya proof URL` : "",
      expensesNeedsProof > 0 ? `${expensesNeedsProof} expense masih Needs Proof` : "",
      tenantReceivable + sponsorReceivable > 0 ? `Receivable belum tertagih ${tenantReceivable + sponsorReceivable}` : "",
      eventMedia.length === 0 ? "Dokumentasi media belum dicatat" : "",
      !event.notes ? "Lessons learned/catatan closeout belum dicatat" : "",
      governanceAuditTrail.length === 0 && eventExpenses.length > 0 ? "Governance_Audit_Log belum terhubung ke expense/event ini" : "",
    ].filter(Boolean);

    const closeoutReadinessChecks = [
      plannedTotal > 0,
      actualExpenseTotal > 0,
      expensesWithoutProof === 0,
      expensesNeedsProof === 0,
      tenantReceivable + sponsorReceivable === 0,
      eventMedia.length > 0,
      Boolean(event.notes),
      eventExpenses.length === 0 || governanceAuditTrail.length > 0,
    ];
    const closeoutReadinessScore = Math.round((closeoutReadinessChecks.filter(Boolean).length / closeoutReadinessChecks.length) * 100);

    const closeout = {
      plannedBudget: plannedTotal,
      actualExpense: actualExpenseTotal,
      budgetVariance: plannedTotal - actualExpenseTotal,
      budgetVariancePct: plannedTotal > 0 ? Math.round(((actualExpenseTotal - plannedTotal) / plannedTotal) * 10000) / 100 : 0,
      tenantRevenuePaid,
      tenantRevenueExpected,
      sponsorRevenuePaid,
      sponsorRevenueExpected,
      totalRevenuePaid: revenuePaidTotal,
      totalRevenueExpected: revenueExpectedTotal,
      receivable: tenantReceivable + sponsorReceivable,
      payable: payableExpenseTotal + payablePurchaseOrderTotal,
      payableFromExpenses: payableExpenseTotal,
      payableFromPurchaseOrders: payablePurchaseOrderTotal,
      purchaseOrderPayableCount: eventPurchaseOrders.filter((item) => isOpenPoStatus(item.status)).length,
      finalProfitLoss: revenuePaidTotal - actualExpenseTotal,
      closeoutReadinessScore,
      closeoutBlockers,
      expensesWithoutProof,
      expensesNeedsProof,
      personalPaidExpenses: eventExpenses.filter((item) => item.paymentMethod === "Personal Paid" || item.shareholderDebtFlag).length,
      documentationStatus: eventMedia.length > 0 ? `${eventMedia.length} media tercatat` : "Belum dicatat",
      mediaCount: eventMedia.length,
      mediaProofUrls: eventMedia.filter((item) => item.url).slice(0, 5).map((item) => item.url),
      lessonsLearned: event.notes || "Belum dicatat",
      governanceAuditCount: governanceAuditTrail.length,
      governanceAuditTrail,
      expenseByCategory,
      expenses: eventExpenses,
      purchaseOrders: eventPurchaseOrders,
    };

    return NextResponse.json({
      event,
      budget: eventBudget,
      tenants: eventTenants,
      sponsors: eventSponsors,
      timeline: eventTimeline,
      media: eventMedia,
      closeout,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch event details", details: String(error) }, { status: 500 });
  }
}
