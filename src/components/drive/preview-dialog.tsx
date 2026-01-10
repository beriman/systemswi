"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DriveItem, getFileIcon, formatFileSize, MIME_TYPES } from "@/lib/drive";

interface PreviewDialogProps {
    file: DriveItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PreviewDialog({ file, open, onOpenChange }: PreviewDialogProps) {
    if (!file) return null;

    const icon = getFileIcon(file.mimeType);
    const modifiedDate = new Date(file.modifiedTime).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    // Determine if file can be previewed in iframe
    const canPreview = file.mimeType === MIME_TYPES.DOCUMENT ||
        file.mimeType === MIME_TYPES.SPREADSHEET ||
        file.mimeType === MIME_TYPES.PRESENTATION ||
        file.mimeType === MIME_TYPES.PDF;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{icon}</span>
                        <span className="truncate">{file.name}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Modified: {modifiedDate}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{file.mimeType}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">{formatFileSize(file.size)}</p>
                        </div>
                    </div>

                    {/* Preview placeholder */}
                    <div className="bg-muted p-8 rounded-lg text-center">
                        {canPreview ? (
                            <div className="space-y-2">
                                <p className="text-6xl">{icon}</p>
                                <p className="text-muted-foreground">
                                    Preview will open in Google Drive
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-6xl">{icon}</p>
                                <p className="text-muted-foreground">
                                    Preview not available for this file type
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            // Will open in Google Drive when API is connected
                            console.log("Open in Drive:", file.id);
                        }}>
                            Open in Drive
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PreviewDialog;
