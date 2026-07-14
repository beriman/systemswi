// GET /api/governance/audit — list Governance_Audit_Log with filters and summary
// POST /api/governance/audit — append a human/system GCG audit action

import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import {
  listGovernanceAuditLog,
  logGovernanceAction,
  summarizeGovernanceAuditLog,
  type GovernanceAuditLogRow,
} from "@/lib/governance/audit";

const SOURCE = "Google Sheets: Governance_Audit_Log";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function amount(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

function sameOrEmpty(value: string, expected: string): boolean {
  return !expected || value.toLowerCase() === expected.toLowerCase();
}

function filterEntries(entries: GovernanceAuditLogRow[], params: URLSearchParams): GovernanceAuditLogRow[] {
  const action = text(params.get("action"));
  const entityType = text(params.get("entityType"));
  const entityId = text(params.get("entityId"));
  const sourceModule = text(params.get("sourceModule"));
  const actor = text(params.get("actor"));
  const from = text(params.get("from"));
  const to = text(params.get("to"));

  return entries.filter((entry) => {
    if (!sameOrEmpty(entry.action, action)) return false;
    if (!sameOrEmpty(entry.entityType, entityType)) return false;
    if (!sameOrEmpty(entry.entityId, entityId)) return false;
    if (sourceModule && !entry.sourceModule.toLowerCase().includes(sourceModule.toLowerCase())) return false;
    if (actor && !entry.actor.toLowerCase().includes(actor.toLowerCase())) return false;
    if (from && entry.timestamp && entry.timestamp < from) return false;
    if (to && entry.timestamp && entry.timestamp > to) return false;
    return true;
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(Number(searchParams.get("limit") || 100), 500));
    const entries = filterEntries(await listGovernanceAuditLog(), searchParams);
    const latestFirst = [...entries].reverse();

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      audit: latestFirst.slice(0, limit),
      summary: summarizeGovernanceAuditLog(entries),
      filters: {
        action: text(searchParams.get("action")) || "",
        entityType: text(searchParams.get("entityType")) || "",
        entityId: text(searchParams.get("entityId")) || "",
        sourceModule: text(searchParams.get("sourceModule")) || "",
        actor: text(searchParams.get("actor")) || "",
        from: text(searchParams.get("from")) || "",
        to: text(searchParams.get("to")) || "",
        limit,
      },
      endpoint: {
        post: "POST JSON { actor, role, action, entityType, entityId, amount, division, before, after, reason, proofUrl, sourceModule } to append an audit row.",
        note: "No mock/fallback data is returned; Google Sheets remains the source of truth.",
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        audit: [],
        summary: summarizeGovernanceAuditLog([]),
      });
    }
    return NextResponse.json({ error: "Failed to fetch Governance_Audit_Log", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = text(body.action);
    const entityType = text(body.entityType);
    const entityId = text(body.entityId);
    if (!action || !entityType || !entityId) {
      return NextResponse.json({ error: "action, entityType, and entityId are required" }, { status: 400 });
    }

    const audit = await logGovernanceAction({
      actor: text(body.actor) || "System",
      role: text(body.role) || "GCG Operator",
      action,
      entityType,
      entityId,
      amount: amount(body.amount),
      division: text(body.division) || "Belum dicatat",
      before: text(body.before),
      after: text(body.after),
      reason: text(body.reason || body.notes),
      proofUrl: text(body.proofUrl),
      sourceModule: text(body.sourceModule) || "/api/governance/audit",
    });

    return NextResponse.json({ success: true, source: SOURCE, sourceStatus: "live", audit }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource(SOURCE, error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menulis Governance_Audit_Log. Tidak ada fallback/mock write yang dibuat.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to append Governance_Audit_Log", details: String(error) }, { status: 500 });
  }
}
