import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, googleWorkspaceWriteBlockedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendRows, readRange, updateRow, deleteRow } from "@/lib/sheets/sheets-real";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";
import { logGovernanceActionSafe } from "@/lib/governance/audit";
import { appendVendorRegisterEntry, parseVendorRegisterRows, updateVendorRegisterEntry, type VendorRegisterEntry } from "@/lib/governance/vendor-register";

export const runtime = "nodejs";

type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  channel: string;
  leadTimeDays: number;
  rating: number;
  status: string;
  lastPo: string;
  notes: string;
  rowNumber: number;
  governanceVendorId?: string;
  relatedParty?: string;
  benchmarkComplete?: boolean;
  riskFlags?: string[];
  approvalRequirement?: string;
};

type PurchaseOrder = {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
  expectedDate: string;
  proofUrl: string;
  notes: string;
  rowNumber: number;
};

type Receipt = {
  timestamp: string;
  id: string;
  poId: string;
  date: string;
  itemId: string;
  sku: string;
  quantity: number;
  qcStatus: "pending" | "passed" | "failed";
  qcNotes: string;
  proofUrl: string;
  pic: string;
  movementRef: string;
  notes: string;
};

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minimumQty: number;
  reorderQty: number;
  unitCost: number;
  supplier: string;
  location: string;
  notes: string;
  rowNumber: number;
};

const text = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
};

function stockStatus(qty: number, minimumQty: number) {
  if (qty <= 0) return "empty";
  if (qty <= minimumQty * 0.5) return "critical";
  if (qty <= minimumQty) return "low";
  return "ok";
}

function parseSuppliers(rows: string[][]): Supplier[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
    id: text(row[0]),
    name: text(row[1]),
    category: text(row[2]) || "TBA",
    contact: text(row[3]) || "TBA",
    channel: text(row[4]) || "TBA",
    leadTimeDays: numberValue(row[5]),
    rating: numberValue(row[6]),
    status: text(row[7]) || "draft",
    lastPo: text(row[8]),
    notes: text(row[9]),
    rowNumber: index + 2,
  })).filter((supplier) => supplier.id && supplier.name);
}

function enrichSuppliersWithVendorGovernance(suppliers: Supplier[], vendorRows: string[][]): Supplier[] {
  const vendors = parseVendorRegisterRows(vendorRows) as VendorRegisterEntry[];
  const byId = new Map(vendors.map((vendor) => [vendor.id.toLowerCase(), vendor]));
  const byName = new Map(vendors.map((vendor) => [vendor.name.toLowerCase(), vendor]));

  return suppliers.map((supplier) => {
    const vendor = byId.get(supplier.id.toLowerCase()) || byName.get(supplier.name.toLowerCase());
    if (!vendor) {
      return {
        ...supplier,
        relatedParty: "Belum dicatat",
        benchmarkComplete: false,
        riskFlags: ["NOT_IN_VENDOR_REGISTER"],
        approvalRequirement: "Daftarkan di Vendor_Register sebelum transaksi besar atau related-party.",
      };
    }
    return {
      ...supplier,
      governanceVendorId: vendor.id,
      relatedParty: vendor.relatedParty,
      benchmarkComplete: Boolean(vendor.priceBenchmark1 && vendor.priceBenchmark2),
      riskFlags: vendor.riskFlags,
      approvalRequirement: vendor.approvalRequirement,
    };
  });
}

function parsePurchaseOrders(rows: string[][]): PurchaseOrder[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => {
    const quantity = numberValue(row[6]);
    const unitCost = numberValue(row[8]);
    return {
      id: text(row[0]),
      date: text(row[1]),
      supplierId: text(row[2]),
      supplierName: text(row[3]),
      itemId: text(row[4]),
      itemName: text(row[5]),
      quantity,
      unit: text(row[7]) || "unit",
      unitCost,
      total: numberValue(row[9]) || quantity * unitCost,
      status: (text(row[10]) as PurchaseOrder["status"]) || "draft",
      expectedDate: text(row[11]) || "TBA",
      proofUrl: text(row[12]),
      notes: text(row[13]),
      rowNumber: index + 2,
    };
  }).filter((po) => po.id);
}

function parseReceipts(rows: string[][]): Receipt[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    timestamp: text(row[0]),
    id: text(row[1]),
    poId: text(row[2]),
    date: text(row[3]),
    itemId: text(row[4]),
    sku: text(row[5]),
    quantity: numberValue(row[6]),
    qcStatus: (text(row[7]) as Receipt["qcStatus"]) || "pending",
    qcNotes: text(row[8]),
    proofUrl: text(row[9]),
    pic: text(row[10]),
    movementRef: text(row[11]),
    notes: text(row[12]),
  }));
}

function parseInventory(rows: string[][]): InventoryItem[] {
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => ({
    id: text(row[0]),
    sku: text(row[1]),
    name: text(row[2]),
    category: text(row[3]) || "other",
    unit: text(row[4]) || "unit",
    qty: numberValue(row[5]),
    minimumQty: numberValue(row[6]),
    reorderQty: numberValue(row[7]),
    unitCost: numberValue(row[8]),
    supplier: text(row[9]) || "TBA",
    location: text(row[10]) || "TBA",
    notes: text(row[13]),
    rowNumber: index + 2,
  })).filter((item) => item.id && item.name);
}

function summarize(pos: PurchaseOrder[], receipts: Receipt[]) {
  const open = pos.filter((po) => ["draft", "ordered", "partial"].includes(po.status));
  return {
    totalPo: pos.length,
    openPo: open.length,
    orderedValue: open.reduce((sum, po) => sum + po.total, 0),
    pendingReceive: open.filter((po) => po.status !== "received").length,
    qcFailed: receipts.filter((receipt) => receipt.qcStatus === "failed").length,
    latestPo: pos.slice(-10).reverse(),
    latestReceipts: receipts.slice(-10).reverse(),
  };
}

function makePoId(existing: PurchaseOrder[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((po) => po.id.includes(today)).length + 1;
  return `PO-${today}-${String(sameDay).padStart(3, "0")}`;
}

function makeReceiptId(existing: Receipt[]) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sameDay = existing.filter((receipt) => receipt.id.includes(today)).length + 1;
  return `GR-${today}-${String(sameDay).padStart(3, "0")}`;
}

function classifyPoApproval(total: number, supplier: Supplier) {
  const flags: string[] = [];
  if (total > 500000) flags.push("DIRECTOR_APPROVAL_REQUIRED");
  if (total > 2000000) flags.push("TWO_BENCHMARKS_REQUIRED");
  if ((supplier.relatedParty || "").toLowerCase() === "yes") flags.push("RELATED_PARTY_VENDOR");
  if (!supplier.governanceVendorId) flags.push("VENDOR_REGISTER_MISSING");
  if (total > 2000000 && !supplier.benchmarkComplete) flags.push("BENCHMARK_INCOMPLETE_FOR_HIGH_VALUE_PO");

  return {
    approvalRequired: flags.length > 0,
    flags,
    requirement: flags.length
      ? "Human review required before ordering: Direktur approve untuk > Rp500.000; > Rp2.000.000 wajib 2 benchmark; related-party wajib deklarasi konflik kepentingan."
      : "Normal procurement approval",
  };
}

async function appendProcurementAudit(entry: { action: string; target: string; summary: string }) {
  try {
    await appendSwiMemoryLog(entry);
    return "ok";
  } catch (error) {
    return isGoogleWorkspaceAuthError(error) ? "blocked" : `warning:${String(error).slice(0, 160)}`;
  }
}

async function appendProcurementGovernanceAudit(entry: {
  actor?: string;
  role?: string;
  action: string;
  entityType: "Supplier" | "Purchase Order" | "Goods Receipt";
  entityId: string;
  amount?: number;
  before?: string;
  after?: string;
  reason: string;
  proofUrl?: string;
}) {
  await logGovernanceActionSafe({
    actor: text(entry.actor) || "System",
    role: text(entry.role) || "Procurement Operator",
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    amount: entry.amount || 0,
    division: "Procurement",
    before: entry.before || "",
    after: entry.after || "",
    reason: entry.reason,
    proofUrl: entry.proofUrl || "",
    sourceModule: "/api/procurement",
  });
}

export async function GET() {
  try {
    const [supplierRows, poRows, receiptRows, vendorRows] = await Promise.all([
      readRange("Supplier_Master!A1:J1000"),
      readRange("Purchase_Orders!A1:N1000"),
      readRange("Goods_Receipts!A1:M1000"),
      readRange("Vendor_Register!A1:L1000").catch(() => []),
    ]);
    const suppliers = enrichSuppliersWithVendorGovernance(parseSuppliers(supplierRows), vendorRows);
    const purchaseOrders = parsePurchaseOrders(poRows);
    const receipts = parseReceipts(receiptRows);
    const vendorExceptions = suppliers.filter((supplier) => (supplier.riskFlags || []).length > 0);
    return NextResponse.json({
      source: "Google Sheets: Supplier_Master + Purchase_Orders + Goods_Receipts + Vendor_Register",
      suppliers,
      purchaseOrders,
      receipts,
      summary: {
        ...summarize(purchaseOrders, receipts),
        vendorRegisterLinked: suppliers.filter((supplier) => supplier.governanceVendorId).length,
        vendorGovernanceExceptions: vendorExceptions.length,
        relatedPartySuppliers: suppliers.filter((supplier) => (supplier.relatedParty || "").toLowerCase() === "yes").length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Supplier_Master + Purchase_Orders + Goods_Receipts", error),
        suppliers: [],
        purchaseOrders: [],
        receipts: [],
        summary: summarize([], []),
      });
    }
    return NextResponse.json({ error: "Gagal membaca procurement", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body.action);

    const [supplierRows, poRows, receiptRows, vendorRows] = await Promise.all([
      readRange("Supplier_Master!A1:J1000"),
      readRange("Purchase_Orders!A1:N1000"),
      readRange("Goods_Receipts!A1:M1000"),
      readRange("Vendor_Register!A1:L1000").catch(() => []),
    ]);
    const suppliers = parseSuppliers(supplierRows);
    const governedSuppliers = enrichSuppliersWithVendorGovernance(suppliers, vendorRows);
    const purchaseOrders = parsePurchaseOrders(poRows);
    const receipts = parseReceipts(receiptRows);

    if (action === "create-po") {
      const supplierId = text(body.supplierId);
      const itemId = text(body.itemId);
      const itemName = text(body.itemName);
      const quantity = numberValue(body.quantity);
      const unitCost = numberValue(body.unitCost);
      if (!supplierId) return NextResponse.json({ error: "supplierId wajib diisi" }, { status: 400 });
      if (!itemId || !itemName) return NextResponse.json({ error: "itemId dan itemName wajib diisi" }, { status: 400 });
      const supplier = governedSuppliers.find((item) => item.id.toLowerCase() === supplierId.toLowerCase());
      if (!supplier) return NextResponse.json({ error: "supplierId tidak ditemukan" }, { status: 404 });
      if (quantity <= 0) return NextResponse.json({ error: "quantity wajib lebih dari 0" }, { status: 400 });
      const poId = text(body.poId) || makePoId(purchaseOrders);
      const date = text(body.date) || new Date().toISOString().slice(0, 10);
      const total = quantity * unitCost;
      const governance = classifyPoApproval(total, supplier);
      const requestedStatus = text(body.status) || "ordered";
      const approvalConfirmed = ["yes", "true", "1", "approved"].includes(text(body.approvalConfirmed || body.directorApproved).toLowerCase());
      const status = governance.approvalRequired && !approvalConfirmed && requestedStatus !== "cancelled" ? "draft" : requestedStatus;
      const row = [
        poId,
        date,
        supplier.id,
        supplier.name,
        itemId,
        itemName,
        quantity,
        text(body.unit) || "unit",
        unitCost,
        total,
        status,
        text(body.expectedDate) || "TBA",
        text(body.proofUrl),
        [
          text(body.notes),
          governance.flags.length ? `GCG flags: ${governance.flags.join(", ")}` : "",
          governance.approvalRequired && !approvalConfirmed ? "Status forced draft until human approval is confirmed." : "",
        ].filter(Boolean).join(" | "),
      ];
      await appendRows("PurchaseOrders", [row]);
      const auditStatus = await appendProcurementAudit({
        action: "Procurement PO Created",
        target: `Purchase_Orders:${poId}`,
        summary: `Created PO ${poId} for supplier ${supplier.name}; item ${itemName}; qty ${quantity} ${text(body.unit) || "unit"}; total ${total}; status ${status}; expected ${text(body.expectedDate) || "TBA"}; governance ${governance.flags.join(", ") || "normal"}`,
      });
      await appendProcurementGovernanceAudit({
        actor: text(body.actor) || text(body.pic),
        role: text(body.role),
        action: "CREATE_PURCHASE_ORDER",
        entityType: "Purchase Order",
        entityId: poId,
        amount: total,
        before: "",
        after: status,
        reason: `Created PO for ${supplier.name}; item ${itemName}; qty ${quantity} ${text(body.unit) || "unit"}; expected ${text(body.expectedDate) || "TBA"}. ${governance.requirement} Flags: ${governance.flags.join(", ") || "none"}.`,
        proofUrl: text(body.proofUrl),
      });
      return NextResponse.json({
        success: true,
        action,
        po: { id: poId, supplierName: supplier.name, total, status },
        governance: {
          ...governance,
          vendorRegisterId: supplier.governanceVendorId || "Belum dicatat",
          statusForcedToDraft: status === "draft" && requestedStatus !== "draft",
        },
        auditStatus,
        governanceAudit: "Governance_Audit_Log",
        syncedSheets: ["Purchase_Orders"],
      }, { status: 201 });
    }

    if (action === "receive") {
      const poId = text(body.poId);
      const po = purchaseOrders.find((item) => item.id.toLowerCase() === poId.toLowerCase());
      const quantity = numberValue(body.quantity);
      const qcStatus = (text(body.qcStatus) || "pending") as Receipt["qcStatus"];
      if (!po) return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 });
      if (quantity <= 0) return NextResponse.json({ error: "quantity wajib lebih dari 0" }, { status: 400 });
      if (!["pending", "passed", "failed"].includes(qcStatus)) return NextResponse.json({ error: "qcStatus wajib pending, passed, atau failed" }, { status: 400 });

      const timestamp = new Date().toISOString();
      const receiptId = text(body.receiptId) || makeReceiptId(receipts);
      const date = text(body.date) || timestamp.slice(0, 10);
      const movementRef = `${receiptId}/${po.id}`;
      const inventoryRows = await readRange("Inventory_Master!A1:O1000");
      const inventory = parseInventory(inventoryRows);
      const inv = inventory.find((item) =>
        item.id.toLowerCase() === po.itemId.toLowerCase() || item.sku.toLowerCase() === po.itemId.toLowerCase()
      );

      await appendRows("GoodsReceipts", [[
        timestamp,
        receiptId,
        po.id,
        date,
        po.itemId,
        inv?.sku || po.itemId,
        quantity,
        qcStatus,
        text(body.qcNotes),
        text(body.proofUrl),
        text(body.pic) || "HemuHemu/OWL",
        movementRef,
        text(body.notes),
      ]]);

      if (qcStatus === "passed" && inv) {
        const newQty = inv.qty + quantity;
        await appendRows("InventoryMovements", [[
          timestamp,
          date,
          inv.id,
          inv.sku,
          "in",
          quantity,
          movementRef,
          text(body.proofUrl),
          text(body.pic) || "HemuHemu/OWL",
          `Receiving ${po.id}: ${text(body.qcNotes) || "QC passed"}`,
        ]]);
        await updateRow("InventoryMaster", inv.rowNumber, [
          inv.id,
          inv.sku,
          inv.name,
          inv.category,
          inv.unit,
          newQty,
          inv.minimumQty,
          inv.reorderQty,
          po.unitCost || inv.unitCost,
          po.supplierName || inv.supplier,
          inv.location,
          stockStatus(newQty, inv.minimumQty),
          timestamp,
          inv.notes,
          movementRef,
        ]);
      }

      const previouslyReceived = receipts
        .filter((receipt) => receipt.poId.toLowerCase() === po.id.toLowerCase() && receipt.qcStatus !== "failed")
        .reduce((sum, receipt) => sum + receipt.quantity, 0);
      const receivedTotal = previouslyReceived + (qcStatus === "failed" ? 0 : quantity);
      const newStatus = receivedTotal >= po.quantity ? "received" : receivedTotal > 0 ? "partial" : po.status;
      await updateRow("PurchaseOrders", po.rowNumber, [
        po.id,
        po.date,
        po.supplierId,
        po.supplierName,
        po.itemId,
        po.itemName,
        po.quantity,
        po.unit,
        po.unitCost,
        po.total,
        newStatus,
        po.expectedDate,
        text(body.proofUrl) || po.proofUrl,
        [po.notes, text(body.notes)].filter(Boolean).join(" | "),
      ]);

      const auditStatus = await appendProcurementAudit({
        action: "Procurement Goods Received",
        target: `Goods_Receipts:${receiptId}`,
        summary: `Received ${quantity} ${po.unit} for PO ${po.id}; QC ${qcStatus}; inventoryUpdated=${qcStatus === "passed" && Boolean(inv)}; movementRef ${movementRef}`,
      });
      await appendProcurementGovernanceAudit({
        actor: text(body.actor) || text(body.pic),
        role: text(body.role),
        action: "RECEIVE_PURCHASE_ORDER",
        entityType: "Goods Receipt",
        entityId: receiptId,
        amount: quantity * (po.unitCost || 0),
        before: po.status,
        after: newStatus,
        reason: `Received ${quantity} ${po.unit} for PO ${po.id}; QC ${qcStatus}; inventoryUpdated=${qcStatus === "passed" && Boolean(inv)}; movementRef ${movementRef}.`,
        proofUrl: text(body.proofUrl),
      });

      return NextResponse.json({
        success: true,
        action,
        receipt: { id: receiptId, poId: po.id, quantity, qcStatus },
        inventoryUpdated: qcStatus === "passed" && Boolean(inv),
        poStatus: newStatus,
        auditStatus,
        governanceAudit: "Governance_Audit_Log",
        syncedSheets: ["Goods_Receipts", "Purchase_Orders", ...(qcStatus === "passed" && inv ? ["Inventory_Master", "Inventory_Movements"] : [])],
      }, { status: 201 });
    }

    if (action === "create-supplier") {
      const name = text(body.name);
      const category = text(body.category);
      const contact = text(body.contact);
      if (!name) return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });
      if (!category) return NextResponse.json({ error: "category wajib diisi" }, { status: 400 });
      const id = text(body.id) || `SUP-${Date.now()}`;
      const row = [
        id,
        name,
        category,
        contact,
        text(body.channel) || "WhatsApp",
        numberValue(body.leadTimeDays) || 7,
        numberValue(body.rating) || 3,
        text(body.status) || "active",
        text(body.lastPo) || "",
        text(body.notes) || "",
      ];
      await appendRows("SupplierMaster", [row]);

      let governanceVendorId = "Belum dicatat";
      let vendorRegisterStatus: "created_trial" | "already_linked" | "warning" = "warning";
      const existingVendor = parseVendorRegisterRows(vendorRows).find((vendor) =>
        vendor.id.toLowerCase() === id.toLowerCase() || vendor.name.toLowerCase() === name.toLowerCase()
      );
      if (existingVendor) {
        governanceVendorId = existingVendor.id;
        vendorRegisterStatus = "already_linked";
      } else {
        try {
          const vendor = await appendVendorRegisterEntry({
            id,
            name,
            category,
            contact,
            relatedParty: text(body.relatedParty) || "No",
            relationshipDetail: text(body.relationshipDetail),
            priceBenchmark1: text(body.priceBenchmark1),
            priceBenchmark2: text(body.priceBenchmark2),
            selectedReason: text(body.selectedReason),
            paymentTerm: text(body.paymentTerm),
            status: "Trial",
            lastReview: new Date().toISOString().slice(0, 10),
          });
          governanceVendorId = vendor.id;
          vendorRegisterStatus = "created_trial";
        } catch (error) {
          vendorRegisterStatus = "warning";
          governanceVendorId = `Belum dicatat — ${String(error).slice(0, 120)}`;
        }
      }

      const auditStatus = await appendProcurementAudit({
        action: "Procurement Supplier Created",
        target: `Supplier_Master:${id}`,
        summary: `Created supplier ${name} (${category}). Contact: ${contact}. Lead time ${numberValue(body.leadTimeDays) || 7} days. Vendor_Register ${vendorRegisterStatus}: ${governanceVendorId}.`,
      });
      await appendProcurementGovernanceAudit({
        actor: text(body.actor) || text(body.pic),
        role: text(body.role),
        action: "CREATE_SUPPLIER",
        entityType: "Supplier",
        entityId: id,
        before: "",
        after: text(body.status) || "active",
        reason: `Created supplier ${name} (${category}). Contact: ${contact || "TBA"}; lead time ${numberValue(body.leadTimeDays) || 7} days. Vendor_Register ${vendorRegisterStatus}: ${governanceVendorId}. Related-party/benchmark fields must be completed before high-value or COI approval.`,
      });
      return NextResponse.json({
        success: true,
        action,
        supplier: { id, name, category },
        vendorRegister: { id: governanceVendorId, status: vendorRegisterStatus, defaultStatus: vendorRegisterStatus === "created_trial" ? "Trial" : undefined },
        auditStatus,
        governanceAudit: "Governance_Audit_Log",
      }, { status: 201 });
    }

    if (action === "update-supplier") {
      const supplierId = text(body.supplierId);
      if (!supplierId) return NextResponse.json({ error: "supplierId wajib diisi" }, { status: 400 });
      const supplier = suppliers.find((s) => s.id.toLowerCase() === supplierId.toLowerCase());
      if (!supplier) return NextResponse.json({ error: "supplier tidak ditemukan" }, { status: 404 });
      const row = [
        supplier.id,
        text(body.name) || supplier.name,
        text(body.category) || supplier.category,
        text(body.contact) || supplier.contact,
        text(body.channel) || supplier.channel,
        numberValue(body.leadTimeDays) || supplier.leadTimeDays,
        numberValue(body.rating) || supplier.rating,
        text(body.status) || supplier.status,
        text(body.lastPo) || supplier.lastPo,
        text(body.notes) || supplier.notes,
      ];
      await updateRow("SupplierMaster", supplier.rowNumber, row);

      let vendorRegisterStatus: "updated" | "created_trial" | "warning" = "warning";
      let governanceVendorId = "Belum dicatat";
      try {
        const existingVendor = parseVendorRegisterRows(vendorRows).find((vendor) =>
          vendor.id.toLowerCase() === supplier.id.toLowerCase()
          || vendor.name.toLowerCase() === supplier.name.toLowerCase()
          || vendor.name.toLowerCase() === text(body.name).toLowerCase()
        );
        const vendorPayload = {
          id: supplier.id,
          name: text(body.name) || supplier.name,
          category: text(body.category) || supplier.category,
          contact: text(body.contact) || supplier.contact,
          relatedParty: text(body.relatedParty) || existingVendor?.relatedParty || "No",
          relationshipDetail: text(body.relationshipDetail) || existingVendor?.relationshipDetail || "",
          priceBenchmark1: text(body.priceBenchmark1) || existingVendor?.priceBenchmark1 || "",
          priceBenchmark2: text(body.priceBenchmark2) || existingVendor?.priceBenchmark2 || "",
          selectedReason: text(body.selectedReason) || existingVendor?.selectedReason || "",
          paymentTerm: text(body.paymentTerm) || existingVendor?.paymentTerm || "TBA",
          status: existingVendor?.status || "Trial",
          lastReview: text(body.lastReview) || new Date().toISOString().slice(0, 10),
        };

        if (existingVendor) {
          const result = await updateVendorRegisterEntry(existingVendor.id, vendorPayload);
          governanceVendorId = result.after.id;
          vendorRegisterStatus = "updated";
        } else {
          const vendor = await appendVendorRegisterEntry(vendorPayload);
          governanceVendorId = vendor.id;
          vendorRegisterStatus = "created_trial";
        }
      } catch (error) {
        governanceVendorId = `Belum dicatat — ${String(error).slice(0, 120)}`;
        vendorRegisterStatus = "warning";
      }

      const auditStatus = await appendProcurementAudit({
        action: "Procurement Supplier Updated",
        target: `Supplier_Master:${supplier.id}`,
        summary: `Updated supplier ${text(body.name) || supplier.name}. Status: ${text(body.status) || supplier.status}. Vendor_Register ${vendorRegisterStatus}: ${governanceVendorId}.`,
      });
      await appendProcurementGovernanceAudit({
        actor: text(body.actor) || text(body.pic),
        role: text(body.role),
        action: "UPDATE_SUPPLIER",
        entityType: "Supplier",
        entityId: supplier.id,
        before: supplier.status,
        after: text(body.status) || supplier.status,
        reason: `Updated supplier ${text(body.name) || supplier.name}. Category ${text(body.category) || supplier.category}; contact ${text(body.contact) || supplier.contact || "TBA"}. Vendor_Register ${vendorRegisterStatus}: ${governanceVendorId}. COI/benchmark/payment-term fields synced for GCG review.`,
      });
      return NextResponse.json({
        success: true,
        action,
        supplier: { id: supplier.id, name: text(body.name) || supplier.name },
        vendorRegister: { id: governanceVendorId, status: vendorRegisterStatus },
        auditStatus,
        governanceAudit: "Governance_Audit_Log",
      }, { status: 200 });
    }

    if (action === "delete-supplier") {
      const supplierId = text(body.supplierId);
      if (!supplierId) return NextResponse.json({ error: "supplierId wajib diisi" }, { status: 400 });
      const supplier = suppliers.find((s) => s.id.toLowerCase() === supplierId.toLowerCase());
      if (!supplier) return NextResponse.json({ error: "supplier tidak ditemukan" }, { status: 404 });
      await deleteRow("SupplierMaster", supplier.rowNumber);
      const auditStatus = await appendProcurementAudit({
        action: "Procurement Supplier Deleted",
        target: `Supplier_Master:${supplier.id}`,
        summary: `Deleted supplier ${supplier.name} (${supplier.category}).`,
      });
      await appendProcurementGovernanceAudit({
        actor: text(body.actor) || text(body.pic),
        role: text(body.role),
        action: "DELETE_SUPPLIER",
        entityType: "Supplier",
        entityId: supplier.id,
        before: supplier.status,
        after: "deleted",
        reason: `Deleted supplier ${supplier.name} (${supplier.category}). Reason: ${text(body.reason || body.notes) || "Belum dicatat"}.`,
      });
      return NextResponse.json({ success: true, action, deleted: supplier.id, auditStatus, governanceAudit: "Governance_Audit_Log" }, { status: 200 });
    }

    if (action === "delete-po") {
      const poId = text(body.poId);
      if (!poId) return NextResponse.json({ error: "poId wajib diisi" }, { status: 400 });
      const po = purchaseOrders.find((p) => p.id.toLowerCase() === poId.toLowerCase());
      if (!po) return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 });
      await deleteRow("PurchaseOrders", po.rowNumber);
      const auditStatus = await appendProcurementAudit({
        action: "Procurement PO Deleted",
        target: `Purchase_Orders:${po.id}`,
        summary: `Deleted PO ${po.id} (${po.itemName} from ${po.supplierName}).`,
      });
      await appendProcurementGovernanceAudit({
        actor: text(body.actor) || text(body.pic),
        role: text(body.role),
        action: "DELETE_PURCHASE_ORDER",
        entityType: "Purchase Order",
        entityId: po.id,
        amount: po.total,
        before: po.status,
        after: "deleted",
        reason: `Deleted PO ${po.id} (${po.itemName} from ${po.supplierName}). Reason: ${text(body.reason || body.notes) || "Belum dicatat"}.`,
        proofUrl: po.proofUrl,
      });
      return NextResponse.json({ success: true, action, deleted: po.id, auditStatus, governanceAudit: "Governance_Audit_Log" }, { status: 200 });
    }

    return NextResponse.json({ error: "action tidak valid. Pilih: create-po, receive, create-supplier, update-supplier, delete-supplier, delete-po" }, { status: 400 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceWriteBlockedSource("Google Sheets: Supplier_Master + Purchase_Orders + Goods_Receipts", error),
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menyimpan procurement. Tidak ada write mock/fallback yang dibuat.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal menyimpan procurement", details: String(error) }, { status: 500 });
  }
}
