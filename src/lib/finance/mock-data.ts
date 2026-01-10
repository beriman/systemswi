// Mock data for finance module
import type { TaxReport, BPJSStatus, LegalDocument, FinancialReport, FreelancerData, RevenueEntry, Setoran, AuditLogEntry } from "./types";

// Tax Reports
export const TAX_REPORTS: TaxReport[] = [
    {
        id: "tax-001",
        type: "pph21",
        period: "2025-12",
        amount: 15000000,
        dueDate: "2026-01-10",
        paidDate: "2026-01-08",
        status: "paid",
        fileUrl: "/docs/tax/pph21-dec-2025.pdf",
    },
    {
        id: "tax-002",
        type: "ppn",
        period: "2025-12",
        amount: 25000000,
        dueDate: "2026-01-31",
        status: "pending",
    },
    {
        id: "tax-003",
        type: "pph23",
        period: "2025-11",
        amount: 8500000,
        dueDate: "2025-12-10",
        status: "overdue",
    },
];

// BPJS Status
export const BPJS_STATUS: BPJSStatus[] = [
    {
        id: "bpjs-001",
        employeeId: "emp-001",
        employeeName: "Diana Putri",
        bpjsKesehatan: { number: "0001234567890", status: "compliant", lastPayment: "2025-12-25" },
        bpjsKetenagakerjaan: { number: "0009876543210", status: "compliant", lastPayment: "2025-12-25" },
    },
    {
        id: "bpjs-002",
        employeeId: "emp-002",
        employeeName: "Rama Wijaya",
        bpjsKesehatan: { number: "0001234567891", status: "compliant", lastPayment: "2025-12-25" },
        bpjsKetenagakerjaan: { number: "0009876543211", status: "warning", lastPayment: "2025-11-25" },
    },
];

// Legal Documents
export const LEGAL_DOCUMENTS: LegalDocument[] = [
    { id: "doc-001", name: "SIUP PT SWI", type: "siup", issueDate: "2021-03-15", expiryDate: "2026-03-15", fileUrl: "/docs/siup.pdf", status: "active" },
    { id: "doc-002", name: "NPWP Perusahaan", type: "npwp", issueDate: "2021-01-10", fileUrl: "/docs/npwp.pdf", status: "active" },
    { id: "doc-003", name: "NIB", type: "nib", issueDate: "2021-02-20", fileUrl: "/docs/nib.pdf", status: "active" },
    { id: "doc-004", name: "Akta Pendirian", type: "akta", issueDate: "2021-01-05", fileUrl: "/docs/akta.pdf", status: "active" },
    { id: "doc-005", name: "TDP (Legacy)", type: "tdp", issueDate: "2021-03-01", expiryDate: "2025-12-31", fileUrl: "/docs/tdp.pdf", status: "expired" },
];

// Financial Reports
export const FINANCIAL_REPORTS: FinancialReport[] = [
    { id: "fin-001", name: "Laporan Laba Rugi Q4 2025", type: "income_statement", period: "2025-Q4", createdAt: "2026-01-05", fileUrl: "/docs/fin/income-q4.pdf" },
    { id: "fin-002", name: "Neraca Q4 2025", type: "balance_sheet", period: "2025-Q4", createdAt: "2026-01-05", fileUrl: "/docs/fin/balance-q4.pdf" },
    { id: "fin-003", name: "Arus Kas 2025", type: "cash_flow", period: "2025", createdAt: "2026-01-03", fileUrl: "/docs/fin/cashflow-2025.pdf" },
];

// Freelancers
export const FREELANCERS: FreelancerData[] = [
    { id: "fl-001", name: "Andi Photographer", email: "andi@foto.com", phone: "081234567890", skills: ["Photography", "Editing"], rate: 2500000, rateType: "daily", totalProjects: 15, totalEarnings: 37500000, lastProject: "Wedding Andi & Rani" },
    { id: "fl-002", name: "Budi Videographer", email: "budi@video.com", phone: "081234567891", skills: ["Videography", "Drone"], rate: 3000000, rateType: "daily", totalProjects: 10, totalEarnings: 30000000, lastProject: "Corporate Bank ABC" },
    { id: "fl-003", name: "Citra MC", email: "citra@mc.com", phone: "081234567892", skills: ["MC", "Host"], rate: 5000000, rateType: "project", totalProjects: 8, totalEarnings: 40000000, lastProject: "Soundwave Festival" },
];

// Revenue
export const REVENUE_ENTRIES: RevenueEntry[] = [
    { id: "rev-001", eventId: "evt-001", eventName: "Wedding Andi & Rani", source: "Full Package", amount: 250000000, date: "2025-12-15", category: "event" },
    { id: "rev-002", eventId: "evt-002", eventName: "Corporate Bank ABC", source: "Event Management", amount: 150000000, date: "2025-11-20", category: "event" },
    { id: "rev-003", source: "Sponsor Gold", amount: 50000000, date: "2025-10-05", category: "sponsorship" },
    { id: "rev-004", source: "Video Production Project", amount: 25000000, date: "2025-12-01", category: "media" },
];

// Setoran
export const SETORANS: Setoran[] = [
    { id: "set-001", eventId: "evt-001", eventName: "Wedding Andi & Rani", totalRevenue: 250000000, holdingPercentage: 10, calculatedAmount: 25000000, status: "paid", dueDate: "2026-01-15", paidDate: "2026-01-10", paidAmount: 25000000 },
    { id: "set-002", eventId: "evt-002", eventName: "Corporate Bank ABC", totalRevenue: 150000000, holdingPercentage: 10, calculatedAmount: 15000000, status: "pending", dueDate: "2026-01-20" },
    { id: "set-003", eventId: "evt-003", eventName: "Soundwave Festival", totalRevenue: 500000000, holdingPercentage: 10, calculatedAmount: 50000000, status: "partial", dueDate: "2025-12-30", paidAmount: 25000000 },
];

// Audit Log
let AUDIT_LOG: AuditLogEntry[] = [
    { id: "log-001", timestamp: "2026-01-10T09:00:00Z", userId: "ceo", userName: "CEO", action: "login", module: "auth", details: "Logged in successfully" },
    { id: "log-002", timestamp: "2026-01-10T09:15:00Z", userId: "coo", userName: "COO", action: "view", module: "finance", details: "Viewed financial reports" },
    { id: "log-003", timestamp: "2026-01-10T09:30:00Z", userId: "ceo", userName: "CEO", action: "approve", module: "workflow", details: "Approved Instagram post request wf-001" },
];

// Helper functions
export function getTaxReports() { return TAX_REPORTS; }
export function getBPJSStatus() { return BPJS_STATUS; }
export function getLegalDocuments() { return LEGAL_DOCUMENTS; }
export function getFinancialReports() { return FINANCIAL_REPORTS; }
export function getFreelancers() { return FREELANCERS; }
export function getRevenueEntries() { return REVENUE_ENTRIES; }
export function getSetorans() { return SETORANS; }
export function getAuditLog() { return AUDIT_LOG; }

// Calculate totals
export function getTotalRevenue(): number {
    return REVENUE_ENTRIES.reduce((sum, r) => sum + r.amount, 0);
}

export function getTotalSetoran(): number {
    return SETORANS.reduce((sum, s) => sum + s.calculatedAmount, 0);
}

export function getPaidSetoran(): number {
    return SETORANS.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
}

export function getPendingSetoran(): number {
    return getTotalSetoran() - getPaidSetoran();
}

// Add audit log entry
export function addAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
    const newEntry: AuditLogEntry = {
        ...entry,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    AUDIT_LOG.unshift(newEntry);
    return newEntry;
}
