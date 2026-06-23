// Role-Based Access Control - Permissions Definition
import type { UserRole } from "./types";

// Available features/modules in the system
export type Feature =
    | "dashboard"
    | "dashboard:overview"
    | "dashboard:quarterly"
    | "qc"
    | "event-cde"
    | "events"
    | "documents"
    | "automation"
    | "reports"
    | "media"
    | "drive"
    | "ai-features"
    | "user-management"
    | "settings";

// Permission level
export type PermissionLevel = "none" | "view" | "edit" | "admin";

// Permission definition per role
export interface RolePermissions {
    role: UserRole;
    label: string;
    description: string;
    permissions: Record<Feature, PermissionLevel>;
}

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    ceo: {
        role: "ceo",
        label: "CEO",
        description: "Chief Executive Officer - Full access to all features",
        permissions: {
            "dashboard": "admin",
            "dashboard:overview": "admin",
            "dashboard:quarterly": "admin",
            "qc": "admin",
            "event-cde": "admin",
            "events": "admin",
            "documents": "admin",
            "automation": "admin",
            "reports": "admin",
            "media": "admin",
            "drive": "admin",
            "ai-features": "admin",
            "user-management": "admin",
            "settings": "admin",
        },
    },
    coo: {
        role: "coo",
        label: "COO",
        description: "Chief Operating Officer - Full access to all features",
        permissions: {
            "dashboard": "admin",
            "dashboard:overview": "admin",
            "dashboard:quarterly": "admin",
            "qc": "admin",
            "event-cde": "admin",
            "events": "admin",
            "documents": "admin",
            "automation": "admin",
            "reports": "admin",
            "media": "admin",
            "drive": "admin",
            "ai-features": "admin",
            "user-management": "admin",
            "settings": "admin",
        },
    },
    komisaris: {
        role: "komisaris",
        label: "Komisaris",
        description: "Komisaris - View-only access to all features",
        permissions: {
            "dashboard": "view",
            "dashboard:overview": "view",
            "dashboard:quarterly": "view",
            "qc": "view",
            "event-cde": "view",
            "events": "view",
            "documents": "view",
            "automation": "view",
            "reports": "view",
            "media": "view",
            "drive": "view",
            "ai-features": "none",
            "user-management": "none",
            "settings": "none",
        },
    },
    panitia: {
        role: "panitia",
        label: "Panitia",
        description: "Panitia Event - Access to Event CDE module only",
        permissions: {
            "dashboard": "none",
            "dashboard:overview": "none",
            "dashboard:quarterly": "none",
            "event-cde": "edit",
            "events": "edit",
            "documents": "view",
            "automation": "edit",
            "reports": "none",
            "media": "none",
            "drive": "none",
            "ai-features": "none",
            "user-management": "none",
            "settings": "none",
        },
    },
    freelancer: {
        role: "freelancer",
        label: "Freelancer",
        description: "External consultant - Limited access to specific data",
        permissions: {
            "dashboard": "none",
            "dashboard:overview": "none",
            "dashboard:quarterly": "none",
            "event-cde": "none",
            "events": "none",
            "documents": "none",
            "automation": "none",
            "reports": "view",
            "media": "none",
            "drive": "view",
            "ai-features": "none",
            "user-management": "none",
            "settings": "none",
        },
    },
};

/**
 * Check if a role has access to a feature
 */
export function hasAccess(role: UserRole, feature: Feature): boolean {
    const permissions = ROLE_PERMISSIONS[role]?.permissions;
    if (!permissions) return false;
    return permissions[feature] !== "none";
}

/**
 * Check if a role can view a feature
 */
export function canView(role: UserRole, feature: Feature): boolean {
    return hasAccess(role, feature);
}

/**
 * Check if a role can edit a feature
 */
export function canEdit(role: UserRole, feature: Feature): boolean {
    const permissions = ROLE_PERMISSIONS[role]?.permissions;
    if (!permissions) return false;
    const level = permissions[feature];
    return level === "edit" || level === "admin";
}

/**
 * Check if a role has admin access to a feature
 */
export function isAdmin(role: UserRole, feature: Feature): boolean {
    const permissions = ROLE_PERMISSIONS[role]?.permissions;
    if (!permissions) return false;
    return permissions[feature] === "admin";
}

/**
 * Get all accessible features for a role
 */
export function getAccessibleFeatures(role: UserRole): Feature[] {
    const permissions = ROLE_PERMISSIONS[role]?.permissions;
    if (!permissions) return [];

    return (Object.entries(permissions) as [Feature, PermissionLevel][])
        .filter(([, level]) => level !== "none")
        .map(([feature]) => feature);
}

/**
 * Get role label
 */
export function getRoleLabel(role: UserRole): string {
    return ROLE_PERMISSIONS[role]?.label || role;
}

/**
 * Get all roles
 */
export function getAllRoles(): UserRole[] {
    return Object.keys(ROLE_PERMISSIONS) as UserRole[];
}
