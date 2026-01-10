"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneratedDocument, DOCUMENT_TYPE_LABELS } from "@/lib/document";

interface DocumentHistoryProps {
    documents: GeneratedDocument[];
    onView: (doc: GeneratedDocument) => void;
    onDelete?: (id: string) => void;
}

export function DocumentHistory({ documents, onView, onDelete }: DocumentHistoryProps) {
    if (documents.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    📄 No documents yet. Create your first document!
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>📚 Recent Documents</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {documents.length} documents
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                            onClick={() => onView(doc)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">
                                    {doc.type === "proposal" ? "📝" :
                                        doc.type === "rab" ? "💰" :
                                            doc.type === "surat_undangan" ? "✉️" :
                                                doc.type === "kontrak" ? "📄" : "📋"}
                                </span>
                                <div>
                                    <p className="font-medium text-sm">{doc.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {DOCUMENT_TYPE_LABELS[doc.type]} • {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                                    </p>
                                    {doc.letterNumber && (
                                        <p className="text-xs text-muted-foreground">No: {doc.letterNumber}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(doc); }}>
                                    👁️
                                </Button>
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                                    >
                                        🗑️
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default DocumentHistory;
