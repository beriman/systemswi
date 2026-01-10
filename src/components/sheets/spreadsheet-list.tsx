"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpreadsheetInfo, SheetInfo, fetchSpreadsheets } from "@/lib/sheets";
import { Skeleton } from "@/components/ui/skeleton";

interface SpreadsheetListProps {
    onSelectSheet?: (spreadsheet: SpreadsheetInfo, sheet: SheetInfo) => void;
}

export function SpreadsheetList({ onSelectSheet }: SpreadsheetListProps) {
    const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchSpreadsheets().then((data) => {
            setSpreadsheets(data);
            setIsLoading(false);
        });
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {spreadsheets.map((spreadsheet) => (
                <Card key={spreadsheet.id}>
                    <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleExpand(spreadsheet.id)}
                    >
                        <CardTitle className="text-lg flex items-center justify-between">
                            {spreadsheet.name}
                            <span className="text-sm font-normal text-muted-foreground">
                                {spreadsheet.sheets.length} sheets
                            </span>
                        </CardTitle>
                        <CardDescription>
                            Last modified: {new Date(spreadsheet.lastModified).toLocaleDateString("id-ID")}
                        </CardDescription>
                    </CardHeader>

                    {expandedId === spreadsheet.id && (
                        <CardContent>
                            <div className="space-y-2">
                                {spreadsheet.sheets.map((sheet) => (
                                    <div
                                        key={sheet.id}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 cursor-pointer"
                                        onClick={() => onSelectSheet?.(spreadsheet, sheet)}
                                    >
                                        <div>
                                            <p className="font-medium">📋 {sheet.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {sheet.rowCount} rows × {sheet.columnCount} cols
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View →
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}

export default SpreadsheetList;
