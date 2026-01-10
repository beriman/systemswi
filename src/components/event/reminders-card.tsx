"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Reminder {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: "low" | "normal" | "high" | "urgent";
    completed: boolean;
}

// Mock reminders
const mockReminders: Reminder[] = [
    { id: "rem-1", title: "Submit KTP", description: "KTP belum diverifikasi", dueDate: "2026-01-15", priority: "high", completed: false },
    { id: "rem-2", title: "Koordinasi Vendor", description: "Meeting dengan vendor venue", dueDate: "2026-01-20", priority: "urgent", completed: false },
    { id: "rem-3", title: "Update RAB", description: "Revisi anggaran konsumsi", dueDate: "2026-01-25", priority: "normal", completed: false },
];

interface RemindersCardProps {
    reminders?: Reminder[];
    onDismiss?: (id: string) => void;
}

export function RemindersCard({ reminders = mockReminders, onDismiss }: RemindersCardProps) {
    const getPriorityStyle = (priority: Reminder["priority"]) => {
        switch (priority) {
            case "urgent": return "border-l-red-500 bg-red-500/5";
            case "high": return "border-l-orange-500 bg-orange-500/5";
            case "normal": return "border-l-blue-500 bg-blue-500/5";
            case "low": return "border-l-gray-500 bg-gray-500/5";
        }
    };

    const pendingReminders = reminders.filter((r) => !r.completed);

    if (pendingReminders.length === 0) {
        return (
            <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                    ✅ No pending reminders
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    🔔 Reminders
                    <span className="text-sm font-normal text-muted-foreground">
                        ({pendingReminders.length} pending)
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {pendingReminders.map((reminder) => (
                        <div
                            key={reminder.id}
                            className={`p-3 rounded-md border-l-4 ${getPriorityStyle(reminder.priority)}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium text-sm">{reminder.title}</p>
                                    <p className="text-xs text-muted-foreground">{reminder.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        📅 Due: {new Date(reminder.dueDate).toLocaleDateString("id-ID")}
                                    </p>
                                </div>
                                {onDismiss && (
                                    <Button variant="ghost" size="sm" onClick={() => onDismiss(reminder.id)}>
                                        ✓
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default RemindersCard;
