"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/lib/dashboard/hooks";

// Format currency to Indonesian Rupiah
function formatCurrency(amount: number): string {
    if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)}M`;
    }
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(0)}jt`;
    }
    return new Intl.NumberFormat("id-ID").format(amount);
}

export function QuarterlySummary() {
    const { quarterly, isLoading } = useDashboardData();

    if (isLoading) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Quarterly Summary</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const quarter = quarterly?.quarter || "Q1";
    const year = quarterly?.year || 2025;
    const eventsCompleted = quarterly?.eventsCompleted || 0;
    const totalRevenue = quarterly?.totalRevenue || 0;
    const targetRevenue = quarterly?.targetRevenue || 0;
    const performance = quarterly?.performance || 0;

    return (
        <Card className="col-span-full border-blue-500/30 bg-blue-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📊 Quarterly Summary - {quarter} {year}
                </CardTitle>
                <CardDescription>
                    Performance overview for commissioners
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Events */}
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Events Completed</p>
                        <p className="text-2xl font-bold">{eventsCompleted}</p>
                    </div>

                    {/* Revenue */}
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">Rp {formatCurrency(totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">
                            Target: Rp {formatCurrency(targetRevenue)}
                        </p>
                    </div>

                    {/* Performance */}
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <p className={`text-2xl font-bold ${performance >= 80 ? "text-green-500" : performance >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                            {performance}%
                        </p>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${performance >= 80 ? "bg-green-500" : performance >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(performance, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default QuarterlySummary;
