"use client";

import { useState } from "react";
import { EventList, CreateEventDialog } from "@/components/event";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/event";

export default function EventsPage() {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");

    const handleCreateEvent = (event: Partial<Event>) => {
        console.log("Creating event:", event);
        // Will implement in API later
        alert(`Event "${event.name}" created (mock)`);
    };

    const handleViewEvent = (event: Event) => {
        console.log("View event:", event.id);
        // Will navigate to detail page later
    };

    const handleEditEvent = (event: Event) => {
        console.log("Edit event:", event.id);
        // Will open edit dialog later
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">📅 Events</h2>
                    <p className="text-muted-foreground">
                        Manage your events and team assignments
                    </p>
                </div>
                <RoleGate feature="events" requiredLevel="edit">
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        + New Event
                    </Button>
                </RoleGate>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {["all", "draft", "planning", "approved", "ongoing", "completed"].map((status) => (
                    <Button
                        key={status}
                        variant={filterStatus === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus(status)}
                        className="capitalize"
                    >
                        {status}
                    </Button>
                ))}
            </div>

            {/* Content */}
            <RoleGate feature="events">
                <EventList
                    filterStatus={filterStatus}
                    onSelectEvent={handleViewEvent}
                    onEditEvent={handleEditEvent}
                />
            </RoleGate>

            {/* Create Dialog */}
            <CreateEventDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={handleCreateEvent}
            />
        </div>
    );
}
