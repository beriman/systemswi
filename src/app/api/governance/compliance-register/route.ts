// GET /api/governance/compliance-register — list GCG compliance obligations
// POST /api/governance/compliance-register — append/seed compliance register entries

import { NextRequest, NextResponse } from "next/server";
import {
  appendComplianceRegisterEntry,
  listComplianceRegister,
  seedKnownComplianceRegisterItems,
  summarizeComplianceRegister,
} from "@/lib/governance/compliance-register";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { logGovernanceActionSafe } from "@/lib/governance/audit";

const SOURCE = "Google Sheets: Compliance_Register";

export async function GET() {
  try {
    const entries = await listComplianceRegister();
    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      entries,
      summary: summarizeComplianceRegister(entries),
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        entries: [],
        summary: { total: 0, open: 0, overdue: 0, dueSoon: 0, completed: 0, missingProof: 0 },
      });
    }
    return NextResponse.json({ error: "Failed to fetch compliance register", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "add");

    if (action === "seed-known") {
      const result = await seedKnownComplianceRegisterItems();
      await logGovernanceActionSafe({
        actor: body.actor || "ETIKA TARIF",
        role: body.role || "Autonomous Governance Agent",
        action: "SEED_COMPLIANCE_REGISTER",
        entityType: "Compliance",
        entityId: "Compliance_Register",
        amount: 0,
        division: "Holding",
        before: "Unseeded/Partial",
        after: `${result.seeded} seeded, ${result.skipped} skipped`,
        reason: body.notes || "Seed known LKPM/BPJS governance obligations from approved GCG plan; no fabricated proof/status.",
        proofUrl: "",
        sourceModule: "/api/governance/compliance-register",
      });
      return NextResponse.json({ success: true, source: SOURCE, sourceStatus: "live", ...result }, { status: 201 });
    }

    if (action !== "add") {
      return NextResponse.json({ error: "action must be add or seed-known" }, { status: 400 });
    }

    if (!body.area || !body.obligation) {
      return NextResponse.json({ error: "area and obligation are required" }, { status: 400 });
    }

    const entry = await appendComplianceRegisterEntry({
      id: body.id,
      area: body.area,
      obligation: body.obligation,
      period: body.period,
      dueDate: body.dueDate,
      status: body.status || "Not Started",
      owner: body.owner || "Belum dicatat",
      sourceProof: body.sourceProof || "",
      riskLevel: body.riskLevel || "Medium",
      notes: body.notes || "",
    });

    await logGovernanceActionSafe({
      actor: body.actor || "Beriman Juliano",
      role: body.role || "Direktur",
      action: "ADD_COMPLIANCE_ITEM",
      entityType: "Compliance",
      entityId: entry.id,
      amount: 0,
      division: "Holding",
      before: "",
      after: entry.status,
      reason: entry.notes,
      proofUrl: entry.sourceProof,
      sourceModule: "/api/governance/compliance-register",
    });

    return NextResponse.json({ success: true, source: SOURCE, sourceStatus: "live", entry }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update compliance register",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update compliance register", details: String(error) }, { status: 500 });
  }
}
