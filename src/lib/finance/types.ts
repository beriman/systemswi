// Finance & Reports types

export type TaxType = "pph21" | "pph23" | "ppn";
export type ReportPeriod = "monthly" | "quarterly" | "yearly";
export type SetoranStatus = "pending" | "partial" | "paid" | "overdue";
export type ComplianceStatus = "compliant" | "warning" | "non_compliant";

// Tax Report
export interface TaxReport {
    id: string;
    type: TaxType;
    period: string; // e.g., "2025-12" for December 2025
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: "pending" | "paid" | "overdue";
    fileUrl?: string;
}

// BPJS Status
export interface BPJSStatus {
    id: string;
    employeeId: string;
    employeeName: string;
    bpjsKesehatan: {
        number: string;
        status: ComplianceStatus;
        lastPayment: string;
    };
    bpjsKetenagakerjaan: {
        number: string;
        status: ComplianceStatus;
        lastPayment: string;
    };
}

// Legal Document
export interface LegalDocument {
    id: string;
    name: string;
    type: "siup" | "npwp" | "tdp" | "akta" | "nib" | "contract" | "other";
    issueDate: string;
    expiryDate?: string;
    fileUrl: string;
    status: "active" | "expired" | "expiring_soon";
}

// Financial Report
export interface FinancialReport {
    id: string;
    name: string;
    type: "income_statement" | "balance_sheet" | "cash_flow" | "rab" | "lpj";
    period: string;
    createdAt: string;
    fileUrl: string;
}

// Freelancer Data
export interface FreelancerData {
    id: string;
    name: string;
    email: string;
    phone: string;
    skills: string[];
    rate: number;
    rateType: "hourly" | "daily" | "project";
    totalProjects: number;
    totalEarnings: number;
    lastProject?: string;
}

// Revenue entry
export interface RevenueEntry {
    id: string;
    eventId?: string;
    eventName?: string;
    source: string;
    amount: number;
    date: string;
    category: "event" | "sponsorship" | "media" | "consulting" | "other";
}

// Setoran (Deposit to holding)
export interface Setoran {
    id: string;
    eventId: string;
    eventName: string;
    totalRevenue: number;
    holdingPercentage: number; // e.g., 10%
    calculatedAmount: number;
    status: SetoranStatus;
    dueDate: string;
    paidDate?: string;
    paidAmount?: number;
}

// Audit Log Entry
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    details: string;
    ipAddress?: string;
}

// Labels
export const TAX_TYPE_LABELS: Record<TaxType, string> = {
    pph21: "PPh 21 (Karyawan)",
    pph23: "PPh 23 (Jasa)",
    ppn: "PPN",
};

export const LEGAL_DOC_LABELS: Record<string, string> = {
    siup: "SIUP",
    npwp: "NPWP",
    tdp: "TDP",
    akta: "Akta Pendirian",
    nib: "NIB",
    contract: "Kontrak",
    other: "Lainnya",
};

export const SETORAN_STATUS_COLORS: Record<SetoranStatus, string> = {
    pending: "yellow",
    partial: "blue",
    paid: "green",
    overdue: "red",
};
