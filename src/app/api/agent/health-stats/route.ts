// GET /api/agent/health-stats — Per-module health statistics from AgentHealthTracker
// Returns uptime %, avg duration, total runs, and last status for each agent module
// Data source: In-memory singleton agentHealthTracker (resets on deploy)
import { NextResponse } from "next/server";
import { agentHealthTracker } from "@/lib/agent/error-recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allStats = agentHealthTracker.getAllStats();

    const modules = Object.entries(allStats).map(([taskName, stats]) => ({
      taskName,
      uptime: stats.uptime,
      avgDurationMs: stats.avgDurationMs,
      totalRuns: stats.totalRuns,
      lastRun: stats.lastRun || null,
      lastStatus: stats.lastStatus || "unknown",
    }));

    // Sort by task name for consistent display
    modules.sort((a, b) => a.taskName.localeCompare(b.taskName));

    // Calculate overall health
    const totalModules = modules.length;
    const healthyModules = modules.filter((m) => m.uptime >= 95).length;
    const degradedModules = modules.filter((m) => m.uptime >= 80 && m.uptime < 95).length;
    const criticalModules = modules.filter((m) => m.uptime < 80).length;

    const overallUptime = totalModules > 0
      ? Math.round(modules.reduce((sum, m) => sum + m.uptime, 0) / totalModules)
      : 100;

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalModules,
        healthyModules,
        degradedModules,
        criticalModules,
        overallUptime,
      },
      modules,
    });
  } catch (error) {
    console.error("[Health Stats API] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
