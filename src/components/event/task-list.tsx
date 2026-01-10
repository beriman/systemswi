"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/event";

interface TaskListProps {
    tasks: Task[];
    onStatusChange?: (taskId: string, status: Task["status"]) => void;
}

export function TaskList({ tasks, onStatusChange }: TaskListProps) {
    const getPriorityColor = (priority: Task["priority"]) => {
        switch (priority) {
            case "urgent": return "text-red-500";
            case "high": return "text-orange-500";
            case "normal": return "text-blue-500";
            case "low": return "text-gray-500";
        }
    };

    const getStatusIcon = (status: Task["status"]) => {
        switch (status) {
            case "completed": return "✅";
            case "in-progress": return "🔄";
            case "pending": return "⏳";
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                <p>Tidak ada task</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <Card key={task.id}>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                {getStatusIcon(task.status)} {task.title}
                            </CardTitle>
                            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                {task.deadline && `📅 ${new Date(task.deadline).toLocaleDateString("id-ID")}`}
                            </div>
                            {task.status !== "completed" && onStatusChange && (
                                <div className="flex gap-1">
                                    {task.status === "pending" && (
                                        <Button size="sm" variant="outline" onClick={() => onStatusChange(task.id, "in-progress")}>
                                            Start
                                        </Button>
                                    )}
                                    {task.status === "in-progress" && (
                                        <Button size="sm" variant="default" onClick={() => onStatusChange(task.id, "completed")}>
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default TaskList;
