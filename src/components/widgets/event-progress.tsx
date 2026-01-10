"use client";

import { StatCard } from "./stat-card";
import { useDashboardData } from "@/lib/dashboard/hooks";
import { StatCardSkeleton } from "@/components/ui/loading-skeletons";

export function EventProgressWidget() {
    const { eventProgress, isLoading } = useDashboardData();

    if (isLoading) {
        return <StatCardSkeleton />;
    }

    const total = eventProgress?.total || 0;
    const completed = eventProgress?.completed || 0;
    const inProgress = eventProgress?.inProgress || 0;
    const upcoming = eventProgress?.upcoming || 0;

    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <StatCard
            title="Event Progress"
            value={`${completed}/${total}`}
            icon="📅"
            description={`${inProgress} in progress, ${upcoming} upcoming`}
            variant={progressPercent >= 50 ? "success" : "default"}
            onClick={() => {
                console.log("Navigate to events");
            }}
        />
    );
}

export default EventProgressWidget;
