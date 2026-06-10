import { NextRequest, NextResponse } from "next/server";
import { appendRows, readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type ComplianceStatus = "passed" | "needs_review" | "blocked" | "draft";
type QcResult = "passed" | "failed" | "needs_review";

const text = (value: unknown) => String(value ?? "").trim();
const num = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

function dataRows(rows: string[][]) {
  return rows.slice(1).filter((row) => row.some((cell) => text(cell)));
}

function parseChecks(rows: string[][]) {
  return dataRows(rows).reverse().map((row, index) => ({
    id: text(row[1]) || `CHECK-${index + 1}`,
    timestamp: text(row[0]),
    formulaId: text(row[1]),
    formulaName: text(row[2]),
    product: text(row[3]),
    ifraCategory: text(row[4]) || "TBA",
    status: text(row[5]) || "draft",
    riskScore: num(row[6]),
    findings: text(row[7]),
    allergenLabel: text(row[8]),
    pic: text(row[9]),
    reference: text(row[10]),
    notes: text(row[11]),
  }));
}

function parseBatches(rows: string[][]) {
  return dataRows(rows).reverse().map((row, index) => ({
    id: text(row[1]) || `BATCH-${index + 1}`,
    timestamp: text(row[0]),
    batchId: text(row[1]),
    product: text(row[2]),
    formulaId: text(row[3]),
    productionDate: text(row[4]),
    quantity: num(row[5]),
    unit: text(row[6]) || "unit",
    qcStatus: text(row[7]) || "pending",
    traceabilityStatus: text(row[8]) || "draft",
    inventoryReference: text(row[9]),
    proofUrl: text(row[10]),
    pic: text(row[11]),
    notes: text(row[12]),
  }));
}

function parseQc(rows: string[][]) {
  return dataRows(rows).reverse().map((row, index) => ({
    id: text(row[1]) || `QC-${index + 1}`,
    timestamp: text(row[0]),
    checklistId: text(row[1]),
    batchId: text(row[2]),
    stage: text(row[3]),
    item: text(row[4]),
    result: text(row[5]) || "needs_review",
    pic: text(row[6]),
    proofUrl: text(row[7]),
    notes: text(row[8]),
  }));
}

function buildAllergenLabel(inputs: string[], reviewerNote: string) {
  const normalized = inputs.map((item) => item.trim()).filter(Boolean);
  if (!normalized.length) return "Allergen: TBA — perlu input komposisi formula sebelum final label.";
  const possibleAllergens = normalized.filter((item) => /limonene|linalool|citral|geraniol|coumarin|eugenol|cinnamal|benzyl/i.test(item));
  const base = possibleAllergens.length
    ? `Contains fragrance allergens: ${possibleAllergens.join(", ")}.`
    : "No common fragrance allergen keywords detected from submitted composition; verify against supplier SDS/COA.";
  return reviewerNote ? `${base} Reviewer note: ${reviewerNote}` : base;
}

function summarize(checks: ReturnType<typeof parseChecks>, batches: ReturnType<typeof parseBatches>, qcs: ReturnType<typeof parseQc>) {
  return {
    totalChecks: checks.length,
    needsReview: checks.filter((check) => check.status === "needs_review" || check.status === "draft").length,
    blocked: checks.filter((check) => check.status === "blocked").length,
    totalBatches: batches.length,
    qcPassed: qcs.filter((qc) => qc.result === "passed").length,
    qcFailed: qcs.filter((qc) => qc.result === "failed").length,
    traceabilityDraft: batches.filter((batch) => batch.traceabilityStatus === "draft" || batch.traceabilityStatus === "incomplete").length,
  };
}

export async function GET() {
  try {
    const [checkRows, batchRows, qcRows] = await Promise.all([
      readRange("Compliance_Checks!A1:L1000").catch(() => []),
      readRange("Product_Batches!A1:M1000").catch(() => []),
      readRange("QC_Checklist!A1:I1000").catch(() => []),
    ]);
    const checks = parseChecks(checkRows);
    const batches = parseBatches(batchRows);
    const qcChecklist = parseQc(qcRows);
    return NextResponse.json({
      source: "Google Sheets: Compliance_Checks + Product_Batches + QC_Checklist",
      generatedAt: new Date().toISOString(),
      summary: summarize(checks, batches, qcChecklist),
      checks: checks.slice(0, 50),
      batches: batches.slice(0, 50),
      qcChecklist: qcChecklist.slice(0, 80),
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membaca compliance", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action);
    const timestamp = new Date().toISOString();

    if (action === "check") {
      const formulaId = text(body.formulaId);
      const formulaName = text(body.formulaName);
      const product = text(body.product);
      if (!formulaId || !formulaName || !product) {
        return NextResponse.json({ error: "formulaId, formulaName, dan product wajib diisi" }, { status: 400 });
      }
      const status = (text(body.status) || "needs_review") as ComplianceStatus;
      if (!["passed", "needs_review", "blocked", "draft"].includes(status)) {
        return NextResponse.json({ error: "status wajib passed, needs_review, blocked, atau draft" }, { status: 400 });
      }
      const materials = Array.isArray(body.materials) ? body.materials.map(text) : text(body.materials).split(/[;,\n]/);
      const allergenLabel = text(body.allergenLabel) || buildAllergenLabel(materials, text(body.notes));
      const row = [
        timestamp,
        formulaId,
        formulaName,
        product,
        text(body.ifraCategory) || "TBA",
        status,
        num(body.riskScore),
        text(body.findings) || "Draft check — verify IFRA category, supplier SDS/COA, and BPOM/label requirements before release.",
        allergenLabel,
        text(body.pic) || "HemuHemu/OWL",
        text(body.reference),
        text(body.notes),
      ];
      await appendRows("ComplianceChecks", [row]);
      return NextResponse.json({ success: true, action, check: { formulaId, formulaName, product, status, allergenLabel }, syncedSheets: ["Compliance_Checks"] }, { status: 201 });
    }

    if (action === "batch") {
      const batchId = text(body.batchId);
      const product = text(body.product);
      if (!batchId || !product) return NextResponse.json({ error: "batchId dan product wajib diisi" }, { status: 400 });
      const row = [
        timestamp,
        batchId,
        product,
        text(body.formulaId),
        text(body.productionDate) || timestamp.slice(0, 10),
        num(body.quantity),
        text(body.unit) || "unit",
        text(body.qcStatus) || "pending",
        text(body.traceabilityStatus) || "draft",
        text(body.inventoryReference),
        text(body.proofUrl),
        text(body.pic) || "HemuHemu/OWL",
        text(body.notes) || "Traceability draft — link inventory movements and QC checklist before release.",
      ];
      await appendRows("ProductBatches", [row]);
      return NextResponse.json({ success: true, action, batch: { batchId, product }, syncedSheets: ["Product_Batches"] }, { status: 201 });
    }

    if (action === "qc") {
      const batchId = text(body.batchId);
      const item = text(body.item);
      if (!batchId || !item) return NextResponse.json({ error: "batchId dan item QC wajib diisi" }, { status: 400 });
      const result = (text(body.result) || "needs_review") as QcResult;
      if (!["passed", "failed", "needs_review"].includes(result)) {
        return NextResponse.json({ error: "result wajib passed, failed, atau needs_review" }, { status: 400 });
      }
      const checklistId = text(body.checklistId) || `QC-${timestamp.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
      const row = [timestamp, checklistId, batchId, text(body.stage) || "finished", item, result, text(body.pic) || "HemuHemu/OWL", text(body.proofUrl), text(body.notes)];
      await appendRows("QCChecklist", [row]);
      return NextResponse.json({ success: true, action, qc: { checklistId, batchId, item, result }, syncedSheets: ["QC_Checklist"] }, { status: 201 });
    }

    return NextResponse.json({ error: "action wajib check, batch, atau qc" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan compliance", details: String(error) }, { status: 500 });
  }
}
