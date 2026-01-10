"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SHEET_LIMITS, calculateUsage, isNearingLimit, SheetInfo } from "@/lib/sheets";

interface LimitAlertProps {
    sheets: SheetInfo[];
}

export function LimitAlert({ sheets }: LimitAlertProps) {
    // Calculate total cells across all sheets
    const totalCells = sheets.reduce(
        (sum, sheet) => sum + sheet.rowCount * sheet.columnCount,
        0
    );

    const usagePercent = calculateUsage(totalCells);
    const nearingLimit = isNearingLimit(usagePercent);

    if (!nearingLimit) return null;

    return (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    ⚠️ Sheet Limit Warning
                </CardTitle>
                <CardDescription>
                    You are using {usagePercent}% of the maximum capacity
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-3">
                        <div
                            className={`h-3 rounded-full ${usagePercent >= 90 ? "bg-red-500" : "bg-yellow-500"
                                }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{totalCells.toLocaleString()} cells used</span>
                        <span>{SHEET_LIMITS.MAX_CELLS.toLocaleString()} max</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Consider archiving old data or splitting into new spreadsheets.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// Compact version for sidebar/widget
export function LimitBadge({ sheets }: LimitAlertProps) {
    const totalCells = sheets.reduce(
        (sum, sheet) => sum + sheet.rowCount * sheet.columnCount,
        0
    );

    const usagePercent = calculateUsage(totalCells);
    const nearingLimit = isNearingLimit(usagePercent);

    if (!nearingLimit) return null;

    return (
        <span className={`text-xs px-2 py-1 rounded ${usagePercent >= 90 ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
            }`}>
            {usagePercent}% used
        </span>
    );
}

export default LimitAlert;
