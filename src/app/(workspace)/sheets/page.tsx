"use client";

import { useState } from "react";
import { SpreadsheetList, SheetViewer } from "@/components/sheets";
import { RoleGate } from "@/components/auth/role-gate";
import { SpreadsheetInfo, SheetInfo } from "@/lib/sheets";

export default function SheetsPage() {
    const [selectedSheet, setSelectedSheet] = useState<{
        spreadsheet: SpreadsheetInfo;
        sheet: SheetInfo;
    } | null>(null);

    const handleSelectSheet = (spreadsheet: SpreadsheetInfo, sheet: SheetInfo) => {
        setSelectedSheet({ spreadsheet, sheet });
    };

    const handleBack = () => {
        setSelectedSheet(null);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold">📊 Sheets</h2>
                <p className="text-muted-foreground">
                    View connected Google Sheets data
                </p>
            </div>

            {/* Content */}
            <RoleGate feature="drive">
                {selectedSheet ? (
                    <SheetViewer
                        sheet={selectedSheet.sheet}
                        onBack={handleBack}
                    />
                ) : (
                    <SpreadsheetList onSelectSheet={handleSelectSheet} />
                )}
            </RoleGate>
        </div>
    );
}
