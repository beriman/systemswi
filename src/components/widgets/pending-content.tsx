"use client";

import { StatCard } from "./stat-card";
import { useDashboardData } from "@/lib/dashboard/hooks";
import { StatCardSkeleton } from "@/components/ui/loading-skeletons";

export function PendingContentWidget() {
    const { pendingContent, isLoading } = useDashboardData();

    if (isLoading) {
        return <StatCardSkeleton />;
    }

    const total = pendingContent?.total || 0;

    return (
        <StatCard
            title="Pending Content"
            value={total}
            icon="📝"
            description={
                total > 0
                    ? `${pendingContent?.byType?.posts || 0} posts, ${pendingContent?.byType?.images || 0} images`
                    : "All content reviewed"
            }
            variant={total > 0 ? "warning" : "success"}
            onClick={() => {
                // Navigate to content review page (will be implemented later)
                console.log("Navigate to content review");
            }}
        />
    );
}

export default PendingContentWidget;
