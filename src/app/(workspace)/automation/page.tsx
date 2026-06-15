"use client";

import { useEffect, useState } from "react";
import { WorkflowCard, WorkflowForm } from "@/components/workflow";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    getWorkflowRequests,
    getPendingApprovals,
    createWorkflowRequest,
    approveWorkflow,
    rejectWorkflow,
    sendTelegramPreview,
    triggerN8nWorkflow,
    WorkflowType,
    WorkflowRequest,
} from "@/lib/workflow";

type ViewState = "list" | "create";

type WhatsAppTemplate = {
    id: string;
    type: string;
    title: string;
    useCase: string;
    defaultAudience: string;
    requiredFields: string[];
    body: string;
};

type FaqItem = {
    id: string;
    category: string;
    question: string;
    answer: string;
    templateId: string;
};

const WORKFLOW_OPTIONS: { type: WorkflowType; icon: string; label: string }[] = [
    { type: "instagram_post", icon: "📸", label: "Instagram Post" },
    { type: "youtube_upload", icon: "📹", label: "YouTube Upload" },
    { type: "telegram_broadcast", icon: "📢", label: "Telegram Broadcast" },
];

export default function AutomationPage() {
    const [view, setView] = useState<ViewState>("list");
    const [selectedType, setSelectedType] = useState<WorkflowType | null>(null);
    const [workflows, setWorkflows] = useState<WorkflowRequest[]>(getWorkflowRequests());
    const [activeTab, setActiveTab] = useState("all");
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [faqKnowledgeBase, setFaqKnowledgeBase] = useState<FaqItem[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [waValues, setWaValues] = useState<Record<string, string>>({});
    const [waPreview, setWaPreview] = useState<{ message: string; waLink?: string | null; note: string } | null>(null);
    const [waStatus, setWaStatus] = useState("Memuat template WhatsApp...");

    const pendingCount = getPendingApprovals().length;
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || templates[0];

    useEffect(() => {
        fetch("/api/whatsapp")
            .then((response) => response.json())
            .then((payload) => {
                setTemplates(payload.templates || []);
                setFaqKnowledgeBase(payload.faqKnowledgeBase || []);
                setSelectedTemplateId(payload.templates?.[0]?.id || "");
                setWaStatus(payload.guardrails?.[0] || "Template WhatsApp siap dipakai.");
            })
            .catch((error) => setWaStatus(`Gagal memuat template WhatsApp: ${String(error)}`));
    }, []);

    const handleCreateNew = (type: WorkflowType) => {
        setSelectedType(type);
        setView("create");
    };

    const handleSubmit = async (data: Record<string, string>) => {
        if (!selectedType) return;

        const newWorkflow = createWorkflowRequest({
            type: selectedType,
            title: data.title || "Untitled Request",
            description: data.description || "",
            createdBy: "current-user@sensasiwangi.id",
            approvalLevel: "manager",
            metadata: data,
        });

        await sendTelegramPreview(newWorkflow.id, "-1001234567890");

        setWorkflows(getWorkflowRequests());
        setView("list");
        setSelectedType(null);
        alert("✅ Request submitted! Telegram preview sent to approval group.");
    };

    const handleApprove = async (id: string) => {
        const result = approveWorkflow(id, "current-approver@sensasiwangi.id");
        if (result) {
            await triggerN8nWorkflow(result.type, result.metadata);
            setWorkflows(getWorkflowRequests());
            alert("✅ Approved! n8n workflow triggered.");
        }
    };

    const handleReject = (id: string) => {
        const reason = prompt("Rejection reason:");
        if (reason) {
            rejectWorkflow(id, reason);
            setWorkflows(getWorkflowRequests());
            alert("❌ Request rejected.");
        }
    };

    const handlePreview = async (id: string) => {
        await sendTelegramPreview(id, "-1001234567890");
        setWorkflows(getWorkflowRequests());
        alert("📤 Preview sent to Telegram group.");
    };

    const handleGenerateWhatsApp = async () => {
        if (!selectedTemplate) return;
        setWaStatus("Membuat preview WhatsApp...");
        setWaPreview(null);
        try {
            const response = await fetch("/api/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId: selectedTemplate.id, values: waValues }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.missing?.join(", ") || payload?.error || "Gagal membuat preview");
            }
            setWaPreview({ message: payload.message, waLink: payload.waLink, note: payload.note });
            setWaStatus("Preview siap. Sistem belum mengirim pesan otomatis.");
        } catch (error) {
            setWaStatus(`Gagal: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const filteredWorkflows = activeTab === "pending"
        ? workflows.filter(w => w.status === "pending_approval")
        : activeTab === "approved"
            ? workflows.filter(w => w.status === "approved" || w.status === "completed")
            : workflows;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">⚡ Automation & Workflows</h2>
                    <p className="text-muted-foreground">
                        Request social media workflow, Telegram approval, dan WhatsApp template preview tanpa auto-send.
                    </p>
                </div>
                {view === "list" && activeTab !== "whatsapp" && (
                    <div className="flex gap-2">
                        {WORKFLOW_OPTIONS.map((opt) => (
                            <Button key={opt.type} variant="outline" onClick={() => handleCreateNew(opt.type)}>
                                {opt.icon} {opt.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <RoleGate feature="ai-features">
                {view === "list" && (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">All Requests</TabsTrigger>
                            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                        </TabsList>

                        {activeTab !== "whatsapp" && (
                            <TabsContent value={activeTab} className="mt-6">
                                {filteredWorkflows.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center text-muted-foreground">
                                            <span className="text-4xl block mb-4">📭</span>
                                            No workflow requests found.
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredWorkflows.map((workflow) => (
                                            <WorkflowCard
                                                key={workflow.id}
                                                workflow={workflow}
                                                onApprove={handleApprove}
                                                onReject={handleReject}
                                                onPreview={handlePreview}
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        )}

                        <TabsContent value="whatsapp" className="mt-6">
                            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>💬 WhatsApp Automation v1</CardTitle>
                                        <CardDescription>
                                            Template FAQ, broadcast, dan customer intake. Guardrail: preview/link saja; tidak ada pesan otomatis yang dikirim.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Template</label>
                                            <select
                                                className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                                                value={selectedTemplate?.id || ""}
                                                onChange={(event) => {
                                                    setSelectedTemplateId(event.target.value);
                                                    setWaValues({});
                                                    setWaPreview(null);
                                                }}
                                            >
                                                {templates.map((template) => (
                                                    <option key={template.id} value={template.id}>{template.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedTemplate && (
                                            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                                <div className="font-medium">{selectedTemplate.useCase}</div>
                                                <div className="text-muted-foreground">Audience: {selectedTemplate.defaultAudience}</div>
                                            </div>
                                        )}

                                        {faqKnowledgeBase.length > 0 && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                                                <div className="font-semibold">FAQ bot knowledge base siap</div>
                                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                    {faqKnowledgeBase.map((faq) => (
                                                        <button
                                                            key={faq.id}
                                                            type="button"
                                                            className="rounded-md border bg-background/70 p-2 text-left text-xs hover:bg-background"
                                                            onClick={() => {
                                                                setSelectedTemplateId(faq.templateId);
                                                                setWaValues((current) => ({ ...current, minatProduk: current.minatProduk || "produk SWI", jenisKelas: current.jenisKelas || "kelas parfumer" }));
                                                                setWaPreview(null);
                                                            }}
                                                        >
                                                            <span className="font-medium">{faq.question}</span>
                                                            <span className="mt-1 block text-muted-foreground">{faq.answer}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-xs text-muted-foreground">Cakupan: jam buka, lokasi, harga kelas, dan produk. Semua jawaban tetap preview manual, bukan auto-send.</p>
                                            </div>
                                        )}

                                        {(selectedTemplate?.requiredFields || []).map((field) => (
                                            <div key={field}>
                                                <label className="text-sm font-medium">{field}</label>
                                                <input
                                                    className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                                                    value={waValues[field] || ""}
                                                    onChange={(event) => setWaValues((current) => ({ ...current, [field]: event.target.value }))}
                                                    placeholder={field === "nomorWa" ? "62811..." : "Isi atau biarkan TBA jika tidak wajib"}
                                                />
                                            </div>
                                        ))}

                                        <Button onClick={handleGenerateWhatsApp}>Generate Preview</Button>
                                        <p className="text-xs text-muted-foreground">{waStatus}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Preview Pesan</CardTitle>
                                        <CardDescription>Copy manual ke WhatsApp Business setelah data dan consent customer diverifikasi.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <pre className="min-h-52 whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm">
                                            {waPreview?.message || selectedTemplate?.body || "Pilih template untuk melihat format pesan."}
                                        </pre>
                                        {waPreview?.waLink && (
                                            <a className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href={waPreview.waLink} target="_blank" rel="noreferrer">
                                                Buka wa.me Preview
                                            </a>
                                        )}
                                        <p className="text-xs text-muted-foreground">{waPreview?.note || "Belum ada pesan yang dikirim dari systemswi."}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                {view === "create" && selectedType && (
                    <div className="max-w-2xl">
                        <WorkflowForm
                            type={selectedType}
                            onSubmit={handleSubmit}
                            onCancel={() => {
                                setView("list");
                                setSelectedType(null);
                            }}
                        />
                    </div>
                )}

                {view === "list" && activeTab !== "whatsapp" && (
                    <div className="grid gap-4 md:grid-cols-4 mt-8">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{workflows.length}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-600">Pending Approval</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-yellow-600">{pendingCount}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-green-600">{workflows.filter(w => w.status === "approved" || w.status === "completed").length}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Telegram Previews</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{workflows.filter(w => w.telegramPreviewSent).length}</div></CardContent>
                        </Card>
                    </div>
                )}
            </RoleGate>
        </div>
    );
}
