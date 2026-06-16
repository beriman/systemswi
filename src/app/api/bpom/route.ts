import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRanges } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const text = (value: unknown) => String(value ?? "").trim();

function isSheetsError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("invalid_grant") || msg.includes("Unauthorized") || msg.includes("401") || msg.includes("403");
}

function dataRows(rows: string[][]) {
  return rows.slice(1).filter((row) => row.some((cell) => text(cell)));
}

function parseRegistrations(rows: string[][]) {
  return dataRows(rows).reverse().map((row, index) => ({
    id: text(row[0]) || `BPOM-${index + 1}`,
    timestamp: text(row[1]),
    productName: text(row[2]),
    brand: text(row[3]),
    category: text(row[4]),
    registrationType: text(row[5]),
    status: text(row[6]),
    submissionDate: text(row[7]),
    approvalDate: text(row[8]),
    expiryDate: text(row[9]),
    certificateNumber: text(row[10]),
    pic: text(row[11]),
    notes: text(row[12]),
    proofUrl: text(row[13]),
  }));
}

export async function GET() {
  try {
    const BPOM_HEADERS = [
      "ID", "Registered At", "Product Name", "Brand", "Category",
      "Registration Type", "Status", "Submission Date", "Approval Date",
      "Expiry Date", "Certificate Number", "PIC", "Notes", "Proof URL",
    ];

    let regRows: string[][] = [];
    let timelineRows: string[][] = [];
    let sourceStatus: "live" | "degraded" = "live";

    try {
      const data = await readRanges([
        "BPOM_Registry!A1:N1000",
        "BPOM_Timeline!A1:J500",
      ]);
      regRows = data["BPOM_Registry!A1:N1000"] || [];
      timelineRows = data["BPOM_Timeline!A1:J500"] || [];
    } catch (err) {
      if (isSheetsError(err)) {
        sourceStatus = "degraded";
      } else {
        throw err;
      }
    }

    const registrations = parseRegistrations(regRows);
    const total = registrations.length;
    const byStatus: Record<string, number> = {};
    for (const reg of registrations) {
      const s = reg.status || "unknown";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    // Expiry alerts: within 90 days
    const now = new Date();
    const expirySoon = registrations.filter((reg) => {
      if (!reg.expiryDate || reg.status === "draft") return false;
      const exp = new Date(reg.expiryDate);
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 90;
    });
    const expired = registrations.filter((reg) => {
      if (!reg.expiryDate) return false;
      return new Date(reg.expiryDate) < now;
    });

    return NextResponse.json({
      registrations,
      summary: {
        total,
        byStatus,
        draft: byStatus["draft"] || 0,
        submitted: byStatus["submitted"] || 0,
        approved: byStatus["approved"] || 0,
        rejected: byStatus["rejected"] || 0,
        expired: byStatus["expired"] || 0,
        expirySoon: expirySoon.length,
        expiredActual: expired.length,
        headers: BPOM_HEADERS,
      },
      alerts: {
        expirySoon,
        expired,
      },
      sourceStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load BPOM data", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "add";
    const now = new Date().toISOString().slice(0, 10);

    if (action === "add") {
      const id = `BPOM-${Date.now()}`;
      const row = [
        id, now,
        body.productName || "", body.brand || "",
        body.category || "Perfume",
        body.registrationType || "Reguler",
        body.status || "draft",
        body.submissionDate || "", body.approvalDate || "",
        body.expiryDate || "", body.certificateNumber || "",
        body.pic || "", body.notes || "", body.proofUrl || "",
      ];
      await appendRows("BPOM_Registry", [row]);
      return NextResponse.json({ success: true, action, id, auditStatus: "written" }, { status: 201 });
    }

    if (action === "update") {
      const row = [
        `LOG-${Date.now()}`, now,
        body.id || "", body.status || "", body.notes || "",
        body.updatedBy || "", "", "", "", "",
      ];
      await appendRows("BPOM_Timeline", [row]);
      return NextResponse.json({ success: true, action: "log_update", auditStatus: "written" });
    }

    if (action === "delete") {
      // Append a deletion marker to Timeline
      const row = [
        `DEL-${Date.now()}`, now,
        body.id || "", "deleted", body.notes || "",
        body.updatedBy || "", "", "", "", "",
      ];
      await appendRows("BPOM_Timeline", [row]);
      return NextResponse.json({ success: true, action: "log_delete", auditStatus: "written" });
    }

    if (action === "seed") {
      const seedRows = [
        ["BPOM-SEED-001", "2025-01-15", "L'Arc~en~Scent EDP 30ml", "L'Arc~en~Scent", "Perfume", "Reguler", "approved", "2024-12-01", "2025-01-10", "2027-01-10", "BPOM-2025-0001", "Beriman", "First BPOM certificate for main product", ""],
        ["BPOM-SEED-002", "2025-06-20", "Pixel Potion Discovery Set", "Pixel Potion", "Perfume", "Reguler", "approved", "2025-05-15", "2025-06-15", "2027-06-15", "BPOM-2025-0042", "Beriman", "Discovery set variation", ""],
        ["BPOM-SEED-003", "2026-03-01", "Nuscentza EDP 50ml", "Nuscentza", "Perfume", "Reguler", "submitted", "2026-03-01", "", "", "", "Beriman", "New size registration in progress", ""],
        ["BPOM-SEED-004", "2026-04-10", "SWI Discovery Travel Kit", "Multi-brand", "Perfume", "Reguler", "draft", "", "", "", "", "Beriman", "Pending — need QC docs", ""],
      ];
      await appendRows("BPOM_Registry", seedRows);
      return NextResponse.json({ success: true, action: "seeded", count: seedRows.length, auditStatus: "written" });
    }

    return NextResponse.json(
      { error: "Unknown action", available: ["add", "update", "delete", "seed"] },
      { status: 400 }
    );
  } catch (error) {
    if (isSheetsError(error)) {
      return NextResponse.json(
        { success: false, error: "Google OAuth token tidak valid. Silakan re-auth.", sourceStatus: "blocked", auditStatus: "blocked" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save BPOM data", details: String(error) },
      { status: 500 }
    );
  }
}
