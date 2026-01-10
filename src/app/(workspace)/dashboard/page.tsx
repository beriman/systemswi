"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { PendingContentWidget, EventProgressWidget, FinancialOverviewWidget, QuarterlySummary } from "@/components/widgets";

export default function DashboardPage() {
    const { accessibleFeatures } = usePermissions();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold">Overview</h2>
                <p className="text-muted-foreground">
                    Welcome to System SWI Dashboard
                </p>
            </div>

            {/* Quarterly Summary - Komisaris & Executive view */}
            <RoleGate feature="dashboard:quarterly">
                <QuarterlySummary />
            </RoleGate>

            {/* Stats Widgets - CEO/COO only */}
            <RoleGate feature="dashboard:overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <PendingContentWidget />
                    <EventProgressWidget />
                    <FinancialOverviewWidget />
                </div>
            </RoleGate>

            {/* Feature Cards - Based on Role */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <RoleGate feature="event-cde">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">📅 Event CDE</CardTitle>
                            <CardDescription>Event management</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Coming soon in Epic 4...
                            </p>
                        </CardContent>
                    </Card>
                </RoleGate>

                <RoleGate feature="media">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">🖼️ Media</CardTitle>
                            <CardDescription>Media management</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Coming soon in Epic 5...
                            </p>
                        </CardContent>
                    </Card>
                </RoleGate>

                <RoleGate feature="ai-features">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">🤖 AI Features</CardTitle>
                            <CardDescription>AI Chat & Assistance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Coming soon in Epic 5...
                            </p>
                        </CardContent>
                    </Card>
                </RoleGate>

                <RoleGate feature="drive">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">📁 Drive</CardTitle>
                            <CardDescription>Google Drive access</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Coming soon in Epic 3...
                            </p>
                        </CardContent>
                    </Card>
                </RoleGate>

                <RoleGate feature="user-management" requiredLevel="admin">
                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle className="text-lg">👥 User Management</CardTitle>
                            <CardDescription>Manage users & invites</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </RoleGate>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-muted-foreground">
                Accessible features: {accessibleFeatures.join(", ") || "none"}
            </div>
        </div>
    );
}
