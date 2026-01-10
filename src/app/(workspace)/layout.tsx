"use client";

import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout";

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        return null;
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
