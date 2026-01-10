"use client";

import { use } from "react";
import { getEventById, getPanitiaByEvent, getTasksByEvent } from "@/lib/event";
import { EventDashboard, PanitiaList, TaskList, RABTable, DivisionProgressCard, RemindersCard } from "@/components/event";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface EventDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
    const { id } = use(params);
    const event = getEventById(id);
    const panitia = getPanitiaByEvent(id);
    const tasks = getTasksByEvent(id);

    if (!event) {
        return (
            <div className="text-center py-12">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-muted-foreground">Event not found</p>
                <Link href="/events">
                    <Button variant="outline" className="mt-4">Back to Events</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link href="/events">
                <Button variant="ghost" size="sm">← Back to Events</Button>
            </Link>

            {/* Event Dashboard */}
            <EventDashboard event={event} />

            {/* Tabs */}
            <Tabs defaultValue="team" className="w-full">
                <TabsList className="grid grid-cols-5 w-full max-w-xl">
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="rab">RAB</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="reminders">Reminders</TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="mt-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">👥 Panitia ({panitia.length})</h3>
                        <PanitiaList panitia={panitia} />
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">📋 Tasks ({tasks.length})</h3>
                        <TaskList tasks={tasks} />
                    </div>
                </TabsContent>

                <TabsContent value="rab" className="mt-6">
                    <RABTable items={[]} />
                </TabsContent>

                <TabsContent value="progress" className="mt-6">
                    <DivisionProgressCard eventId={id} />
                </TabsContent>

                <TabsContent value="reminders" className="mt-6">
                    <RemindersCard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
