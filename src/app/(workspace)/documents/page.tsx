"use client";

import { useState } from "react";
import { TemplateCard, DocumentForm, DocumentPreview, DocumentHistory } from "@/components/document";
import { RoleGate } from "@/components/auth/role-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getAllTemplates,
    generateDocumentContent,
    generateLetterNumber,
    formatLetterNumber,
    DocumentTemplate,
    GeneratedDocument,
    getDocumentHistory,
    saveDocumentToHistory,
    deleteDocumentFromHistory,
    createGeneratedDocument,
    exportToPDF,
} from "@/lib/document";

type ViewState = "list" | "form" | "preview";

export default function DocumentsPage() {
    const [view, setView] = useState<ViewState>("list");
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [generatedContent, setGeneratedContent] = useState("");
    const [letterNumber, setLetterNumber] = useState("");
    const [currentDocument, setCurrentDocument] = useState<GeneratedDocument | null>(null);
    const [history, setHistory] = useState<GeneratedDocument[]>(() => getDocumentHistory());
    const [activeTab, setActiveTab] = useState("create");

    const templates = getAllTemplates();

    const handleSelectTemplate = (template: DocumentTemplate) => {
        setSelectedTemplate(template);
        setView("form");
    };

    const handleGenerate = (data: Record<string, string>) => {
        if (!selectedTemplate) return;

        // Generate letter number for official documents
        const needsLetterNumber = ["surat_undangan", "kontrak", "surat_tugas", "proposal"].includes(
            selectedTemplate.type
        );

        let ln = "";
        if (needsLetterNumber) {
            const letterNum = generateLetterNumber();
            ln = formatLetterNumber(letterNum);
            setLetterNumber(ln);
        }

        // Generate content
        const content = generateDocumentContent(selectedTemplate.type, data, ln);
        setGeneratedContent(content);

        // Create and save document
        const doc = createGeneratedDocument(
            selectedTemplate.type,
            selectedTemplate.name,
            content,
            ln,
            data.event || undefined
        );
        setCurrentDocument(doc);
        saveDocumentToHistory(doc);
        setHistory(getDocumentHistory());

        setView("preview");
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

    const handleSaveToDrive = () => {
        alert("Document saved to Drive (mock)");
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
                    Generate proposals, reports, and official letters
                </p>
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
