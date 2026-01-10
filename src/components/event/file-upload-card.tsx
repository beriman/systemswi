"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FileUploadProps {
    eventId: string;
    panitiaId: string;
    type: "ktp" | "document" | "bukti";
    onUpload: (file: File) => void;
}

export function FileUploadCard({ type, onUpload }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
        }
    };

    const handleUpload = () => {
        if (file) {
            onUpload(file);
            setFile(null);
        }
    };

    const getTitle = () => {
        switch (type) {
            case "ktp": return "Upload KTP";
            case "document": return "Upload Document";
            case "bukti": return "Upload Bukti Pembayaran";
        }
    };

    return (
        <Card
            className={`border-dashed ${isDragging ? "border-primary bg-primary/5" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">{getTitle()}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-4">
                    {file ? (
                        <div className="space-y-2">
                            <p className="text-sm">📄 {file.name}</p>
                            <Button size="sm" onClick={handleUpload}>Upload</Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-muted-foreground text-sm">Drag & drop or click to select</p>
                            <Input
                                type="file"
                                className="max-w-xs mx-auto"
                                accept={type === "ktp" ? "image/*" : "*"}
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default FileUploadCard;
