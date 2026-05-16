"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SheetData, fetchSheetData, SheetInfo } from "@/lib/sheets";
import { Skeleton } from "@/components/ui/skeleton";

interface SheetViewerProps {
    sheet: SheetInfo;
    onBack?: () => void;
}

export function SheetViewer({ sheet, onBack }: SheetViewerProps) {
    const [sheetState, setSheetState] = useState<{ sheetId: string; data: SheetData | null }>({
        sheetId: "",
        data: null,
    });

    useEffect(() => {
        let isCurrent = true;

        fetchSheetData(sheet.id).then((result) => {
            if (isCurrent) {
                setSheetState({ sheetId: sheet.id, data: result });
            }
        });

        return () => {
            isCurrent = false;
        };
    }, [sheet.id]);

    const isLoading = sheetState.sheetId !== sheet.id;
    const data = isLoading ? null : sheetState.data;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    No data available for this sheet
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        📋 {sheet.name}
                        <span className="text-sm font-normal text-muted-foreground">
                            ({data.totalRows} rows)
                        </span>
                    </CardTitle>
                    {onBack && (
                        <Button variant="outline" size="sm" onClick={onBack}>
                            ← Back
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-auto max-h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {data.headers.map((header) => (
                                    <TableHead key={header}>{header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rows.map((row) => (
                                <TableRow key={row.rowIndex}>
                                    {data.headers.map((header) => (
                                        <TableCell key={header}>
                                            {String(row.values[header] ?? "-")}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {data.rows.length < data.totalRows && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Showing {data.rows.length} of {data.totalRows} rows
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default SheetViewer;
