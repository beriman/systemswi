// Event Management types

export type EventStatus = "draft" | "planning" | "approved" | "ongoing" | "completed" | "cancelled";

export interface Event {
    id: string;
    name: string;
    description?: string;
    date: string;
    endDate?: string;
    location: string;
    status: EventStatus;
    budget: number;
    spentBudget: number;
    estimatedParticipants: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    driveFolderId?: string;
}

export interface Panitia {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    eventId: string;
    division: Division;
    role: PanitiaRole;
    assignedAt: string;
    ktpStatus: "pending" | "uploaded" | "verified";
    ktpFileId?: string;
}

export type Division =
    | "koordinator"
    | "acara"
    | "dokumentasi"
    | "publikasi"
    | "logistik"
    | "konsumsi"
    | "perlengkapan"
    | "keamanan";

export type PanitiaRole = "ketua" | "anggota";

export interface Task {
    id: string;
    eventId: string;
    assignedTo: string; // panitia id
    title: string;
    description?: string;
    status: "pending" | "in-progress" | "completed";
    deadline?: string;
    priority: "low" | "normal" | "high" | "urgent";
    createdAt: string;
    completedAt?: string;
}

export interface RABItem {
    id: string;
    eventId: string;
    category: string;
    item: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: "planned" | "approved" | "purchased" | "cancelled";
    notes?: string;
}

export interface PaymentRecord {
    id: string;
    eventId: string;
    panitiaId: string;
    amount: number;
    description: string;
    status: "pending" | "paid" | "verified";
    paidAt?: string;
    verifiedAt?: string;
    proofFileId?: string;
}

// Division labels
export const DIVISION_LABELS: Record<Division, string> = {
    koordinator: "Koordinator",
    acara: "Sie Acara",
    dokumentasi: "Sie Dokumentasi",
    publikasi: "Sie Publikasi",
    logistik: "Sie Logistik",
    konsumsi: "Sie Konsumsi",
    perlengkapan: "Sie Perlengkapan",
    keamanan: "Sie Keamanan",
};

// Status colors
export const STATUS_COLORS: Record<EventStatus, string> = {
    draft: "gray",
    planning: "blue",
    approved: "green",
    ongoing: "yellow",
    completed: "emerald",
    cancelled: "red",
};
