// GET /api/governance/vendor-register — list vendor governance register
// POST /api/governance/vendor-register — append vendor with conflict-of-interest fields
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { logGovernanceActionSafe } from "@/lib/governance/audit";
import {
  appendVendorRegisterEntry,
  listVendorRegister,
  summarizeVendorRegister,
} from "@/lib/governance/vendor-register";

const SOURCE = "Google Sheets: Vendor_Register";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export async function GET() {
  try {
    const vendors = await listVendorRegister();
    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      vendors,
      summary: summarizeVendorRegister(vendors),
      policy: {
        thresholdLow: "<= Rp500.000: PIC divisi boleh submit; tetap tercatat",
        thresholdDirector: "Rp500.001–Rp2.000.000: Direktur approve",
        thresholdBenchmark: "> Rp2.000.000: Direktur approve + minimal 2 pembanding vendor",
        relatedParty: "Vendor related party: Direktur approve + catatan konflik kepentingan",
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        vendors: [],
        summary: summarizeVendorRegister([]),
      });
    }
    return NextResponse.json({ error: "Failed to fetch Vendor_Register", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = text(body.name || body.vendorName);
    const category = text(body.category);
    if (!name) return NextResponse.json({ error: "name/vendorName wajib diisi" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "category wajib diisi" }, { status: 400 });

    const vendor = await appendVendorRegisterEntry({
      id: text(body.id),
      name,
      category,
      contact: text(body.contact),
      relatedParty: text(body.relatedParty) || "No",
      relationshipDetail: text(body.relationshipDetail),
      priceBenchmark1: text(body.priceBenchmark1),
      priceBenchmark2: text(body.priceBenchmark2),
      selectedReason: text(body.selectedReason),
      paymentTerm: text(body.paymentTerm),
      status: text(body.status) || "Trial",
      lastReview: text(body.lastReview),
    });

    await logGovernanceActionSafe({
      actor: text(body.actor) || "System",
      role: text(body.role) || "GCG Operator",
      action: "CREATE_VENDOR_REGISTER",
      entityType: "Vendor",
      entityId: vendor.id,
      amount: 0,
      division: text(body.division) || "Procurement",
      before: "",
      after: vendor.status,
      reason: [
        `Vendor ${vendor.name} (${vendor.category})`,
        vendor.relatedParty === "Yes" ? `Related party: ${vendor.relationshipDetail || "Belum dicatat"}` : "Related party: No",
        vendor.riskFlags.length ? `Flags: ${vendor.riskFlags.join(", ")}` : "No TARIF flags",
      ].join(" | "),
      proofUrl: "",
      sourceModule: "/api/governance/vendor-register",
    });

    return NextResponse.json({
      success: true,
      source: SOURCE,
      vendor,
      summary: summarizeVendorRegister([vendor]),
      audit: "Governance_Audit_Log",
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource(SOURCE, error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menyimpan Vendor_Register. Tidak ada write mock/fallback yang dibuat.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to append Vendor_Register", details: String(error) }, { status: 500 });
  }
}
