"use client";

import { StatCard } from "./stat-card";
import { useDashboardData } from "@/lib/dashboard/hooks";
import { StatCardSkeleton } from "@/components/ui/loading-skeletons";

// Format currency to Indonesian Rupiah
function formatCurrency(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}jt`;
    }
    return new Intl.NumberFormat("id-ID").format(amount);
}

export function FinancialOverviewWidget() {
    const { financialOverview, isLoading } = useDashboardData();

    if (isLoading) {
        return <StatCardSkeleton />;
    }

    const spent = financialOverview?.spent || 0;
    const budget = financialOverview?.totalBudget || 0;
    const remaining = financialOverview?.remaining || 0;
    const pendingApprovals = financialOverview?.pendingApprovals || 0;

    const spentPercent = budget > 0 ? Math.round((spent / budget) * 100) : 0;

    return (
        <StatCard
            title="Financial"
            value={`Rp ${formatCurrency(remaining)}`}
            icon="💰"
            description={`${spentPercent}% spent${pendingApprovals > 0 ? `, ${pendingApprovals} pending` : ""}`}
            variant={pendingApprovals > 0 ? "warning" : spentPercent > 80 ? "danger" : "success"}
            onClick={() => {
                console.log("Navigate to financial");
            }}
        />
    );
}

export default FinancialOverviewWidget;
