"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@/lib/event";

interface EventCardProps {
    event: Event;
    onView?: (event: Event) => void;
    onEdit?: (event: Event) => void;
}

export function EventCard({ event, onView, onEdit }: EventCardProps) {
    const progress = event.budget > 0 ? Math.round((event.spentBudget / event.budget) * 100) : 0;

    const getStatusClasses = (status: string) => {
        switch (status) {
            case "draft": return "bg-gray-500/20 text-gray-500";
            case "planning": return "bg-blue-500/20 text-blue-500";
            case "approved": return "bg-green-500/20 text-green-500";
            case "ongoing": return "bg-yellow-500/20 text-yellow-500";
            case "completed": return "bg-emerald-500/20 text-emerald-500";
            case "cancelled": return "bg-red-500/20 text-red-500";
            default: return "bg-gray-500/20 text-gray-500";
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription>{event.location}</CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusClasses(event.status)}`}>
                        {event.status}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm">
                        <span>📅</span>
                        <span>{new Date(event.date).toLocaleDateString("id-ID")}</span>
                        {event.endDate && (
                            <span className="text-muted-foreground">
                                - {new Date(event.endDate).toLocaleDateString("id-ID")}
                            </span>
                        )}
                    </div>

                    {/* Budget progress */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span>Budget: Rp {(event.budget / 1000000).toFixed(1)}jt</span>
                            <span>{progress}% used</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${progress > 80 ? "bg-red-500" : "bg-primary"}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>👥</span>
                        <span>{event.estimatedParticipants} peserta</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => onView?.(event)} className="flex-1">
                            View
                        </Button>
                        <Button variant="default" size="sm" onClick={() => onEdit?.(event)} className="flex-1">
                            Edit
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default EventCard;
