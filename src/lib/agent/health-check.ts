// Agent Health Check — checks all SWI systems
import { readRange } from "@/lib/sheets/sheets-real";

export type HealthStatus = "healthy" | "degraded" | "critical";
export type CheckStatus = "ok" | "warn" | "fail";

export interface HealthCheck {
  name: string;
  status: CheckStatus;
  detail: string;
  responseTimeMs?: number;
}

export interface HealthReport {
  status: HealthStatus;
  checks: HealthCheck[];
  timestamp: string;
  totalResponseTimeMs: number;
}

async function checkGoogleSheets(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await readRange("Dashboard!A1:F9");
    const ms = Date.now() - start;
    return {
      name: "Google Sheets",
      status: ms < 5000 ? "ok" : "warn",
      detail: `Responsiveness ${ms}ms — Dashboard dapat dibaca`,
      responseTimeMs: ms,
    };
  } catch (error) {
    return {
      name: "Google Sheets",
      status: "fail",
      detail: `Tidak dapat membaca sheet: ${String(error).slice(0, 100)}`,
    };
  }
}

async function checkFinanceSheets(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await readRange("Rekap_Rekening!A1:H10");
    const ms = Date.now() - start;
    return {
      name: "Finance (Rekap Rekening)",
      status: "ok",
      detail: `Rekap rekening dapat dibaca (${ms}ms)`,
      responseTimeMs: ms,
    };
  } catch (error) {
    return {
      name: "Finance (Rekap Rekening)",
      status: "fail",
      detail: `Gagal baca rekap rekening: ${String(error).slice(0, 100)}`,
    };
  }
}

async function checkInventorySheet(): Promise<HealthCheck> {
  try {
    const rows = await readRange("Inventory_Master!A1:O100");
    const count = Math.max(rows.length - 1, 0);
    return {
      name: "Inventory Master",
      status: "ok",
      detail: `${count} item terbaca dari Inventory_Master`,
    };
  } catch (error) {
    return {
      name: "Inventory Master",
      status: "warn",
      detail: `Inventory belum ada data: ${String(error).slice(0, 80)}`,
    };
  }
}

async function checkVercelDeployment(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://systemswi.vercel.app";
    const response = await fetch(appUrl, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    const ms = Date.now() - start;
    return {
      name: "Vercel Deployment",
      status: response.ok ? "ok" : "warn",
      detail: `HTTP ${response.status} dalam ${ms}ms`,
      responseTimeMs: ms,
    };
  } catch (error) {
    return {
      name: "Vercel Deployment",
      status: "warn",
      detail: `Deployment check gagal: ${String(error).slice(0, 80)}`,
    };
  }
}

async function checkAlertsAPI(): Promise<HealthCheck> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/alerts`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      return { name: "Alerts API", status: "warn", detail: `HTTP ${response.status}` };
    }
    const data = await response.json();
    const total = data.summary?.total || 0;
    const critical = data.summary?.bySeverity?.critical || 0;
    return {
      name: "Alerts API",
      status: critical > 0 ? "warn" : "ok",
      detail: `${total} alerts aktif, ${critical} critical`,
    };
  } catch (error) {
    return {
      name: "Alerts API",
      status: "warn",
      detail: `Alerts check gagal: ${String(error).slice(0, 80)}`,
    };
  }
}

export async function runHealthCheck(): Promise<HealthReport> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  const results = await Promise.allSettled([
    checkGoogleSheets(),
    checkFinanceSheets(),
    checkInventorySheet(),
    checkVercelDeployment(),
    checkAlertsAPI(),
  ]);

  const checks: HealthCheck[] = results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const names = ["Google Sheets", "Finance", "Inventory", "Vercel", "Alerts API"];
    return {
      name: names[index] || `Check ${index}`,
      status: "fail" as CheckStatus,
      detail: `Check gagal dijalankan: ${String(result.reason).slice(0, 100)}`,
    };
  });

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  let status: HealthStatus = "healthy";
  if (failCount >= 2) status = "critical";
  else if (failCount >= 1 || warnCount >= 2) status = "degraded";

  return {
    status,
    checks,
    timestamp,
    totalResponseTimeMs: Date.now() - start,
  };
}
