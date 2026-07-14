// GET /api/governance/vendor-register — list vendor governance register
// POST /api/governance/vendor-register — append vendor with conflict-of-interest fields
// PUT /api/governance/vendor-register — update vendor governance review / COI fields
import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { logGovernanceActionSafe } from "@/lib/governance/audit";
import {
  appendVendorRegisterEntry,
  listVendorRegister,
  summarizeVendorRegister,
  updateVendorRegisterEntry,
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
        vendorRequiredCategories: "Bahan Baku, Packaging, Venue, Dokumentasi, Sewa Booth wajib Vendor_Register/Vendor Name sebelum approval expense",
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = text(body.id || body.vendorId);
    if (!id) return NextResponse.json({ error: "id/vendorId wajib diisi" }, { status: 400 });

    const result = await updateVendorRegisterEntry(id, {
      name: body.name ?? body.vendorName,
      category: body.category,
      contact: body.contact,
      relatedParty: body.relatedParty,
      relationshipDetail: body.relationshipDetail,
      priceBenchmark1: body.priceBenchmark1,
      priceBenchmark2: body.priceBenchmark2,
      selectedReason: body.selectedReason,
      paymentTerm: body.paymentTerm,
      status: body.status,
      lastReview: body.lastReview,
    });

    await logGovernanceActionSafe({
      actor: text(body.actor) || "Beriman Juliano",
      role: text(body.role) || "Direktur / Procurement",
      action: "UPDATE_VENDOR_REGISTER",
      entityType: "Vendor",
      entityId: id,
      amount: 0,
      division: text(body.division) || "Procurement",
      before: `${result.before.status} | related-party ${result.before.relatedParty} | flags ${result.before.riskFlags.join(", ") || "none"}`,
      after: `${result.after.status} | related-party ${result.after.relatedParty} | flags ${result.after.riskFlags.join(", ") || "none"}`,
      reason: text(body.reason || body.notes) || `Review Vendor_Register ${result.after.name}; ${result.after.approvalRequirement}`,
      proofUrl: "",
      sourceModule: "/api/governance/vendor-register",
    });

    return NextResponse.json({
      success: true,
      source: SOURCE,
      sourceStatus: "live",
      before: result.before,
      vendor: result.after,
      audit: "Governance_Audit_Log",
      policy: {
        relatedParty: "Jika Related Party = Yes, detail relasi + alasan objektif + 2 benchmark harus lengkap sebelum transaksi besar/approval.",
        benchmark: "> Rp2.000.000 wajib minimal 2 pembanding vendor atau catatan benchmark di expense.",
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource(SOURCE, error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update Vendor_Register. Tidak ada write mock/fallback yang dibuat.",
      }, { status: 503 });
    }
    const message = String(error);
    if (message.includes("Vendor not found")) return NextResponse.json({ error: message }, { status: 404 });
    return NextResponse.json({ error: "Failed to update Vendor_Register", details: message }, { status: 500 });
  }
}
