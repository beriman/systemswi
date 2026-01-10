"use client";

import { useState } from "react";
import { FileBrowser, PreviewDialog } from "@/components/drive";
import { RoleGate } from "@/components/auth/role-gate";
import { DriveItem } from "@/lib/drive";

export default function DrivePage() {
    const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleFileSelect = (file: DriveItem) => {
        setSelectedFile(file);
        setPreviewOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold">📁 Drive</h2>
                <p className="text-muted-foreground">
                    Browse company files and documents
                </p>
            </div>

            {/* File Browser */}
            <RoleGate feature="drive">
                <FileBrowser onFileSelect={handleFileSelect} />
            </RoleGate>

            {/* Preview Dialog */}
            <PreviewDialog
                file={selectedFile}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
            />
        </div>
    );
}
