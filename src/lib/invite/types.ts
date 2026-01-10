// Invite System Types
import type { Feature } from "@/lib/auth/permissions";

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Invite {
    id: string;
    code: string;              // UUID for invite link
    email?: string;            // Optional: restrict to specific email
    accessScope: Feature[];    // Features freelancer can access
    createdBy: string;         // CEO/COO user ID
    createdByName: string;     // Creator's name
    createdAt: string;
    expiresAt: string;         // 7 days default
    acceptedAt?: string;
    acceptedBy?: string;
    acceptedByName?: string;
    status: InviteStatus;
}

export interface CreateInviteInput {
    email?: string;
    accessScope: Feature[];
    expiresInDays?: number;    // Default: 7
}

export interface AcceptInviteInput {
    code: string;
    userId: string;
    userName: string;
    email: string;
}
