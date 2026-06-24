// API route: /api/agent/circuit-breaker
// Returns circuit breaker stats for Google Sheets and other services
import { NextResponse } from "next/server";
import { getAllCircuitBreakerStats } from "@/lib/sheets/circuit-breaker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getAllCircuitBreakerStats();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      circuitBreakers: stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
