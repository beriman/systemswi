// Dashboard mock data for MVP
// Will be replaced with real API calls later

export interface PendingContent {
    total: number;
    byType: {
        posts: number;
        images: number;
    };
}

export interface EventProgress {
    total: number;
    completed: number;
    inProgress: number;
    upcoming: number;
}

export interface FinancialOverview {
    totalBudget: number;
    spent: number;
    remaining: number;
    pendingApprovals: number;
}

export interface QuarterlyData {
    quarter: string;
    year: number;
    eventsCompleted: number;
    totalRevenue: number;
    targetRevenue: number;
    performance: number; // percentage
}

export interface DashboardData {
    pendingContent: PendingContent;
    eventProgress: EventProgress;
    financialOverview: FinancialOverview;
    quarterly: QuarterlyData;
    lastUpdated: string;
}

// Mock data
export const mockDashboardData: DashboardData = {
    pendingContent: {
        total: 5,
        byType: {
            posts: 2,
            images: 3,
        },
    },
    eventProgress: {
        total: 8,
        completed: 3,
        inProgress: 2,
        upcoming: 3,
    },
    financialOverview: {
        totalBudget: 50000000, // 50jt
        spent: 32000000,
        remaining: 18000000,
        pendingApprovals: 3,
    },
    quarterly: {
        quarter: "Q4",
        year: 2025,
        eventsCompleted: 12,
        totalRevenue: 150000000, // 150jt
        targetRevenue: 200000000, // 200jt
        performance: 75,
    },
    lastUpdated: new Date().toISOString(),
};

// Fetch function (mock for now)
export async function fetchDashboardData(): Promise<DashboardData> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockDashboardData;
}
