"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Division, DIVISION_LABELS } from "@/lib/event";

interface DivisionProgress {
    division: Division;
    totalTasks: number;
    completedTasks: number;
    panitiaCount: number;
}

// Mock progress data
const mockProgress: DivisionProgress[] = [
    { division: "koordinator", totalTasks: 5, completedTasks: 4, panitiaCount: 1 },
    { division: "acara", totalTasks: 10, completedTasks: 6, panitiaCount: 3 },
    { division: "dokumentasi", totalTasks: 8, completedTasks: 2, panitiaCount: 2 },
    { division: "publikasi", totalTasks: 6, completedTasks: 4, panitiaCount: 2 },
    { division: "logistik", totalTasks: 12, completedTasks: 8, panitiaCount: 4 },
    { division: "konsumsi", totalTasks: 4, completedTasks: 1, panitiaCount: 2 },
];

interface DivisionProgressCardProps {
    eventId: string;
    progress?: DivisionProgress[];
}

export function DivisionProgressCard({ progress = mockProgress }: DivisionProgressCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>📊 Division Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {progress.map((div) => {
                        const progressPercent = div.totalTasks > 0
                            ? Math.round((div.completedTasks / div.totalTasks) * 100)
                            : 0;

                        return (
                            <div key={div.division} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{DIVISION_LABELS[div.division]}</span>
                                    <span className="text-muted-foreground">
                                        {div.completedTasks}/{div.totalTasks} tasks • {div.panitiaCount} members
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${progressPercent === 100 ? "bg-green-500" :
                                                progressPercent >= 50 ? "bg-primary" :
                                                    "bg-yellow-500"
                                            }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default DivisionProgressCard;
