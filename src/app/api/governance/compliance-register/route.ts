// GET /api/governance/compliance-register — list GCG compliance obligations
// POST /api/governance/compliance-register — append/seed compliance register entries

import { NextRequest, NextResponse } from "next/server";
import {
  appendComplianceRegisterEntry,
  buildComplianceRegisterReminders,
  listComplianceRegister,
  seedKnownComplianceRegisterItems,
  summarizeComplianceRegister,
  updateComplianceRegisterEntry,
} from "@/lib/governance/compliance-register";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { logGovernanceActionSafe } from "@/lib/governance/audit";

const SOURCE = "Google Sheets: Compliance_Register";

export async function GET() {
  try {
    const entries = await listComplianceRegister();
    const summary = summarizeComplianceRegister(entries);
    const reminders = buildComplianceRegisterReminders(entries);
    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      entries,
      summary,
      reminders,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        entries: [],
        summary: { total: 0, open: 0, overdue: 0, dueSoon: 0, completed: 0, missingProof: 0 },
        reminders: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch compliance register", details: String(error) }, { status: 500 });
  }
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function isCompletedStatus(value: unknown): boolean {
  return ["submitted", "paid", "complete", "completed"].includes(text(value).toLowerCase());
}

function isAutomationActor(value: unknown): boolean {
  const normalized = text(value).toLowerCase();
  return ["agent", "system", "systemswi", "hermes", "hemuhemu", "automation", "cron", "etika tarif"].some((marker) => normalized.includes(marker));
}

function isHumanOnlyArea(value: unknown): boolean {
  const normalized = text(value).toLowerCase();
  return ["lkpm", "pajak", "tax", "bpjs", "bpjskt", "bpjsks", "legal", "bpom", "halal"].some((marker) => normalized.includes(marker));
}

function validateHumanCompletion(body: Record<string, unknown>) {
  if (!isCompletedStatus(body.status)) return null;
  const area = body.area || body.obligation || body.id || body.complianceId;
  if (!isHumanOnlyArea(area)) return null;
  if (!isAutomationActor(body.actor)) return null;
  return "Compliance LKPM/BPJS/Pajak/legal/BPOM/Halal hanya boleh ditandai Submitted/Paid/Complete oleh aktor manusia dengan Source Proof; agent/cron hanya boleh membuat draft/reminder.";
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

    const humanCompletionError = validateHumanCompletion(body);
    if (humanCompletionError) {
      return NextResponse.json({ error: humanCompletionError }, { status: 422 });
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = text(body.id || body.complianceId);
    if (!id) return NextResponse.json({ error: "id/complianceId wajib diisi" }, { status: 400 });

    const currentEntries = await listComplianceRegister();
    const current = currentEntries.find((entry) => entry.id === id);
    if (!current) return NextResponse.json({ error: `Compliance item not found: ${id}` }, { status: 404 });
    const humanCompletionError = validateHumanCompletion({
      ...body,
      area: body.area ?? current.area,
      obligation: body.obligation ?? current.obligation,
    });
    if (humanCompletionError) {
      return NextResponse.json({ error: humanCompletionError }, { status: 422 });
    }

    const result = await updateComplianceRegisterEntry(id, {
      area: body.area,
      obligation: body.obligation,
      period: body.period,
      dueDate: body.dueDate,
      status: body.status,
      owner: body.owner,
      sourceProof: body.sourceProof,
      riskLevel: body.riskLevel,
      notes: body.notes,
    });

    await logGovernanceActionSafe({
      actor: text(body.actor) || "Beriman Juliano",
      role: text(body.role) || "Direktur",
      action: "UPDATE_COMPLIANCE_ITEM",
      entityType: "Compliance",
      entityId: id,
      amount: 0,
      division: "Holding",
      before: `${result.before.status} | due ${result.before.dueDate || "TBA"}`,
      after: `${result.after.status} | due ${result.after.dueDate || "TBA"}`,
      reason: text(body.reason || body.notes) || `Update compliance ${result.after.obligation}`,
      proofUrl: result.after.sourceProof,
      sourceModule: "/api/governance/compliance-register",
    });

    return NextResponse.json({
      success: true,
      source: SOURCE,
      sourceStatus: "live",
      before: result.before,
      entry: result.after,
      audit: "Governance_Audit_Log",
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update compliance register",
        details: String(error),
      }, { status: 503 });
    }
    const message = String(error);
    if (message.includes("Source Proof wajib") || message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 422 });
    }
    return NextResponse.json({ error: "Failed to update compliance register", details: message }, { status: 500 });
  }
}
