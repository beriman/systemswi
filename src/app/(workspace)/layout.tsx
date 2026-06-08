"use client";

import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout";

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const enableAuth = process.env.NEXT_PUBLIC_ENABLE_AUTH === "true";

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // Redirect to login only when auth is explicitly enabled.
    // During development, System SWI should open directly to the dashboard.
    if (enableAuth && !user) {
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        return null;
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
