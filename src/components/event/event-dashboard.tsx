"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Event } from "@/lib/event";
import { StatCard } from "@/components/widgets/stat-card";

interface EventDashboardProps {
    event: Event;
}

export function EventDashboard({ event }: EventDashboardProps) {
    const budgetUsage = event.budget > 0
        ? Math.round((event.spentBudget / event.budget) * 100)
        : 0;

    const daysUntilEvent = Math.ceil(
        (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Days Until Event"
                    value={daysUntilEvent > 0 ? daysUntilEvent : "Past"}
                    icon="📅"
                    variant={daysUntilEvent <= 7 ? "warning" : "default"}
                />
                <StatCard
                    title="Budget Usage"
                    value={`${budgetUsage}%`}
                    icon="💰"
                    variant={budgetUsage > 80 ? "danger" : "success"}
                />
                <StatCard
                    title="Participants"
                    value={event.estimatedParticipants}
                    icon="👥"
                />
                <StatCard
                    title="Status"
                    value={event.status}
                    icon="📋"
                    variant={event.status === "approved" ? "success" : "default"}
                />
            </div>

            {/* Event Info */}
            <Card>
                <CardHeader>
                    <CardTitle>{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">{event.location}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium">
                                {new Date(event.date).toLocaleDateString("id-ID")}
                                {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString("id-ID")}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="font-medium">Rp {event.budget.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="font-medium">Rp {event.spentBudget.toLocaleString("id-ID")}</p>
                        </div>
                    </div>
                    {event.description && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p>{event.description}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default EventDashboard;
