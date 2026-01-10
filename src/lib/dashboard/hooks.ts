"use client";

import { useState, useEffect } from "react";
import { fetchDashboardData, type DashboardData } from "./mock-data";

export function useDashboardData() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const dashboardData = await fetchDashboardData();
                setData(dashboardData);
            } catch (err) {
                setError("Failed to load dashboard data");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    return {
        ...data,
        pendingContent: data?.pendingContent,
        eventProgress: data?.eventProgress,
        financialOverview: data?.financialOverview,
        quarterly: data?.quarterly,
        isLoading,
        error,
        refresh: async () => {
            const newData = await fetchDashboardData();
            setData(newData);
        },
    };
}
