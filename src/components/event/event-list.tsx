"use client";

import { Event, getEvents } from "@/lib/event";
import { EventCard } from "./event-card";

interface EventListProps {
    onSelectEvent?: (event: Event) => void;
    onEditEvent?: (event: Event) => void;
    filterStatus?: string;
}

export function EventList({ onSelectEvent, onEditEvent, filterStatus }: EventListProps) {
    let events = getEvents();

    if (filterStatus && filterStatus !== "all") {
        events = events.filter((e) => e.status === filterStatus);
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-2">📅</p>
                <p>No events found</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    onView={onSelectEvent}
                    onEdit={onEditEvent}
                />
            ))}
        </div>
    );
}

export default EventList;
