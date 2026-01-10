"use client";

import { useAuth } from "@/hooks/use-auth";
import {
    hasAccess,
    canView,
    canEdit,
    isAdmin,
    getAccessibleFeatures,
    getRoleLabel,
    type Feature
} from "@/lib/auth/permissions";

/**
 * usePermissions hook - provides permission checking utilities for current user
 */
export function usePermissions() {
    const { user, isLoading, isAuthenticated } = useAuth();

    const role = user?.role;

    return {
        // Current role info
        role,
        roleLabel: role ? getRoleLabel(role) : null,
        isLoading,
        isAuthenticated,

        // Permission checks
        hasAccess: (feature: Feature) => role ? hasAccess(role, feature) : false,
        canView: (feature: Feature) => role ? canView(role, feature) : false,
        canEdit: (feature: Feature) => role ? canEdit(role, feature) : false,
        isAdmin: (feature: Feature) => role ? isAdmin(role, feature) : false,

        // Get all accessible features
        accessibleFeatures: role ? getAccessibleFeatures(role) : [],

        // Role checks
        isCEO: role === "ceo",
        isCOO: role === "coo",
        isKomisaris: role === "komisaris",
        isPanitia: role === "panitia",
        isFreelancer: role === "freelancer",
        isExecutive: role === "ceo" || role === "coo",
    };
}

export default usePermissions;
