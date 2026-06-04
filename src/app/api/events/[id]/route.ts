// GET /api/events/[id] — Get single event details (budget, tenants, sponsors, timeline)
import { NextRequest, NextResponse } from "next/server";
import { readEventSheet, EVENT_SHEETS } from "@/lib/event/sheets";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Next.js 16: params is a Promise
) {
  try {
    const { id } = await params;

    // Fetch all related data in parallel
    const [events, budget, tenants, sponsors, timeline] = await Promise.all([
      readEventSheet(EVENT_SHEETS.Events).catch(() => []),
      readEventSheet(EVENT_SHEETS.Budget).catch(() => []),
      readEventSheet(EVENT_SHEETS.Tenants).catch(() => []),
      readEventSheet(EVENT_SHEETS.Sponsors).catch(() => []),
      readEventSheet(EVENT_SHEETS.Timeline).catch(() => []),
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

    return NextResponse.json({
      event,
      budget: eventBudget,
      tenants: eventTenants,
      sponsors: eventSponsors,
      timeline: eventTimeline,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch event details", details: String(error) }, { status: 500 });
  }
}
