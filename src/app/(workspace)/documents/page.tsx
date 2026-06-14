"use client";

import { useState, useEffect } from "react";
import { TemplateCard, DocumentForm, DocumentPreview, DocumentHistory } from "@/components/document";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getAllTemplates,
    DocumentTemplate,
    GeneratedDocument,
    getDocumentHistory,
    saveDocumentToHistory,
    deleteDocumentFromHistory,
    exportToPDF,
} from "@/lib/document";

type ViewState = "list" | "form" | "preview";

export default function DocumentsPage() {
    const [view, setView] = useState<ViewState>("list");
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [generatedContent, setGeneratedContent] = useState("");
    const [letterNumber, setLetterNumber] = useState("");
    const [currentDocument, setCurrentDocument] = useState<GeneratedDocument | null>(null);
    const [history, setHistory] = useState<GeneratedDocument[]>([]);
    const [activeTab, setActiveTab] = useState("create");
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const templates = getAllTemplates();

    // Load history on mount
    useEffect(() => {
        setHistory(getDocumentHistory());
    }, []);

    const handleSelectTemplate = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setView("form");
    };

    const handleGenerate = async (data: Record<string, string>) => {
        if (!selectedTemplate) return;

        setIsGenerating(true);
        setStatusMessage("Generate dokumen dengan context Google Sheets...");
        try {
            const response = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: selectedTemplate.type, data }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.missing?.join(", ") || payload?.error || "Gagal generate dokumen");
            }

            const doc: GeneratedDocument = payload.document;
            setLetterNumber(doc.letterNumber || "");
            setGeneratedContent(doc.content);
            setCurrentDocument(doc);
            saveDocumentToHistory(doc);
            setHistory(getDocumentHistory());
            setStatusMessage(`Dokumen berhasil dibuat. Source: ${payload.source}`);
            setView("preview");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setStatusMessage(`Gagal: ${message}`);
            alert(`Gagal generate dokumen: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBack = () => {
        if (view === "preview") {
            setView("form");
        } else {
            setView("list");
            setSelectedTemplate(null);
            setCurrentDocument(null);
        }
    };

    const handleViewFromHistory = (doc: GeneratedDocument) => {
        setGeneratedContent(doc.content);
        setLetterNumber(doc.letterNumber || "");
        setCurrentDocument(doc);
        setSelectedTemplate({
            id: doc.id,
            type: doc.type,
            name: doc.title,
            description: "",
            icon: "📄",
            fields: []
        });
        setView("preview");
        setActiveTab("create");
    };

    const handleDeleteFromHistory = (id: string) => {
        if (confirm("Delete this document?")) {
            deleteDocumentFromHistory(id);
            setHistory(getDocumentHistory());
        }
    };

    const handleSaveToDrive = async () => {
        if (!currentDocument) return;

        setStatusMessage("Menyimpan draft ke Google Docs dan mencatat audit...");
        try {
            const response = await fetch("/api/documents/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentDocument.id,
                    type: currentDocument.type,
                    title: currentDocument.title,
                    content: generatedContent,
                    letterNumber: currentDocument.letterNumber,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || payload?.details || "Gagal simpan ke Google Docs");
            }

            const updatedDocument: GeneratedDocument = {
                ...currentDocument,
                driveFileId: payload.document?.driveFileId,
                driveUrl: payload.document?.driveUrl,
            };
            setCurrentDocument(updatedDocument);
            saveDocumentToHistory(updatedDocument);
            setHistory(getDocumentHistory());
            setStatusMessage(`Tersimpan ke Google Docs: ${payload.document?.driveUrl || payload.document?.driveFileId}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setStatusMessage(`Gagal simpan Google Docs: ${message}`);
            alert(`Gagal simpan Google Docs: ${message}`);
        }
    };

    const handleExportPDF = () => {
        if (currentDocument) {
            exportToPDF({
                title: currentDocument.title,
                letterNumber: currentDocument.letterNumber,
                content: generatedContent,
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold">📄 Document Generator</h2>
                <p className="text-muted-foreground">
                    Generate invoice, proposal sponsor, tenant agreement, RAB, dan monthly report dengan konteks Google Sheets.
                </p>
                {statusMessage && (
                    <p className="mt-2 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {isGenerating ? "⏳ " : "ℹ️ "}{statusMessage}
                    </p>
                )}
            </div>

            <RoleGate feature="ai-features">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="create">Create New</TabsTrigger>
                        <TabsTrigger value="history">History ({history.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="mt-6">
                        {view === "list" && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {templates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onSelect={handleSelectTemplate}
                                    />
                                ))}
                            </div>
                        )}

                        {view === "form" && selectedTemplate && (
                            <div className="max-w-2xl">
                                <DocumentForm
                                    template={selectedTemplate}
                                    onGenerate={handleGenerate}
                                    onCancel={handleBack}
                                />
                            </div>
                        )}

                        {view === "preview" && selectedTemplate && (
                            <DocumentPreview
                                content={generatedContent}
                                title={selectedTemplate.name}
                                letterNumber={letterNumber}
                                onSaveToDrive={handleSaveToDrive}
                                onExportPDF={handleExportPDF}
                                onBack={handleBack}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-6">
                        <DocumentHistory
                            documents={history}
                            onView={handleViewFromHistory}
                            onDelete={handleDeleteFromHistory}
                        />
                    </TabsContent>
                </Tabs>
            </RoleGate>
        </div>
    );
}
