// In-memory invite store (MVP - will move to Google Drive later)
import type { Invite, CreateInviteInput, AcceptInviteInput } from "./types";

// In-memory storage
const invites: Map<string, Invite> = new Map();

/**
 * Generate unique code for invite
 */
function generateCode(): string {
    return crypto.randomUUID();
}

/**
 * Create a new invite
 */
export function createInvite(
    input: CreateInviteInput,
    creatorId: string,
    creatorName: string
): Invite {
    const id = crypto.randomUUID();
    const code = generateCode();
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 7));

    const invite: Invite = {
        id,
        code,
        email: input.email,
        accessScope: input.accessScope,
        createdBy: creatorId,
        createdByName: creatorName,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: "pending",
    };

    invites.set(id, invite);
    return invite;
}

/**
 * Get all invites created by a user
 */
export function getInvitesByCreator(creatorId: string): Invite[] {
    return Array.from(invites.values())
        .filter((invite) => invite.createdBy === creatorId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get invite by code
 */
export function getInviteByCode(code: string): Invite | null {
    const invite = Array.from(invites.values()).find((inv) => inv.code === code);
    if (!invite) return null;

    // Check if expired
    if (new Date(invite.expiresAt) < new Date() && invite.status === "pending") {
        invite.status = "expired";
        invites.set(invite.id, invite);
    }

    return invite;
}

/**
 * Get invite by ID
 */
export function getInviteById(id: string): Invite | null {
    return invites.get(id) || null;
}

/**
 * Accept an invite
 */
export function acceptInvite(input: AcceptInviteInput): Invite | null {
    const invite = getInviteByCode(input.code);

    if (!invite) return null;
    if (invite.status !== "pending") return null;

    // Check email restriction
    if (invite.email && invite.email.toLowerCase() !== input.email.toLowerCase()) {
        return null;
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date().toISOString();
    invite.acceptedBy = input.userId;
    invite.acceptedByName = input.userName;

    invites.set(invite.id, invite);
    return invite;
}

/**
 * Revoke an invite
 */
export function revokeInvite(id: string, userId: string): boolean {
    const invite = invites.get(id);
    if (!invite) return false;
    if (invite.createdBy !== userId) return false;
    if (invite.status !== "pending") return false;

    invite.status = "revoked";
    invites.set(id, invite);
    return true;
}

/**
 * Get all invites (admin only)
 */
export function getAllInvites(): Invite[] {
    return Array.from(invites.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
