// Phase 3.4 — Customer Segmentation (RFM) API
import { NextResponse } from "next/server";
import { performRFMSegmentation } from "@/lib/agent/customer-segmentation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await performRFMSegmentation();
    return NextResponse.json({
      success: true,
      data: {
        totalCustomers: result.totalCustomers,
        totalRevenue: result.totalRevenue,
        avgCLV: result.avgCLV,
        topSegment: result.topSegment,
        segmentCounts: result.segmentCounts,
        topCustomers: result.customers.slice(0, 10).map((c) => ({
          name: c.customerName,
          segment: c.segment,
          rfmScore: c.rfmScore,
          recency: c.recency,
          frequency: c.frequency,
          monetary: c.monetary,
          clv: c.clv,
        })),
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error("[API] Customer segmentation error:", error);
    return NextResponse.json(
      { success: false, error: "Customer segmentation failed" },
      { status: 500 }
    );
  }
}
