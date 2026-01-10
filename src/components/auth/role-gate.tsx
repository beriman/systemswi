"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { hasAccess, canEdit, isAdmin, type Feature } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

interface RoleGateProps {
    children: ReactNode;
    feature: Feature;
    requiredLevel?: "view" | "edit" | "admin";
    fallback?: ReactNode;
    roles?: UserRole[]; // Optional: specific roles allowed
}

/**
 * RoleGate component - conditionally renders children based on user role permissions
 */
export function RoleGate({
    children,
    feature,
    requiredLevel = "view",
    fallback = null,
    roles,
}: RoleGateProps) {
    const { user, isLoading } = useAuth();

    // Show nothing while loading
    if (isLoading) {
        return null;
    }

    // No user = no access
    if (!user) {
        return <>{fallback}</>;
    }

    // If specific roles are provided, check those
    if (roles && roles.length > 0) {
        if (!roles.includes(user.role)) {
            return <>{fallback}</>;
        }
        return <>{children}</>;
    }

    // Check permission level for feature
    let hasPermission = false;
    switch (requiredLevel) {
        case "admin":
            hasPermission = isAdmin(user.role, feature);
            break;
        case "edit":
            hasPermission = canEdit(user.role, feature);
            break;
        case "view":
        default:
            hasPermission = hasAccess(user.role, feature);
            break;
    }

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Convenience component for admin-only content
 */
export function AdminOnly({
    children,
    feature,
    fallback
}: {
    children: ReactNode;
    feature: Feature;
    fallback?: ReactNode;
}) {
    return (
        <RoleGate feature={feature} requiredLevel="admin" fallback={fallback}>
            {children}
        </RoleGate>
    );
}

/**
 * Convenience component for editable content
 */
export function CanEdit({
    children,
    feature,
    fallback
}: {
    children: ReactNode;
    feature: Feature;
    fallback?: ReactNode;
}) {
    return (
        <RoleGate feature={feature} requiredLevel="edit" fallback={fallback}>
            {children}
        </RoleGate>
    );
}

export default RoleGate;
