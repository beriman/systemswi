"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
    onUpload?: (files: FileList) => void;
    currentFolderId: string;
}

export function FileUpload({ onUpload, currentFolderId }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files: FileList) => {
        setSelectedFiles(Array.from(files));
        onUpload?.(files);
    };

    const uploadFiles = async () => {
        // MVP: Log upload
        console.log("Uploading to folder:", currentFolderId);
        console.log("Files:", selectedFiles);

        // Clear selection after "upload"
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <Card
            className={`p-6 border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted"
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="text-center space-y-4">
                <p className="text-4xl">📤</p>
                <p className="text-muted-foreground">
                    Drag & drop files here, or click to select
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                />

                <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Select Files
                </Button>

                {/* Selected files */}
                {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {selectedFiles.length} file(s) selected:
                        </p>
                        <ul className="text-sm text-muted-foreground">
                            {selectedFiles.map((file, i) => (
                                <li key={i}>{file.name}</li>
                            ))}
                        </ul>
                        <Button onClick={uploadFiles}>
                            Upload Files
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default FileUpload;
