"use client";

import { useState } from "react";
import { WorkflowCard, WorkflowForm } from "@/components/workflow";
import { RoleGate } from "@/components/auth/role-gate";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

    const pendingCount = getPendingApprovals().length;

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

        // Auto-send Telegram preview
        await sendTelegramPreview(newWorkflow.id, "-1001234567890");

        setWorkflows(getWorkflowRequests());
        setView("list");
        setSelectedType(null);
        alert("✅ Request submitted! Telegram preview sent to approval group.");
    };

    const handleApprove = async (id: string) => {
        const result = approveWorkflow(id, "current-approver@sensasiwangi.id");
        if (result) {
            // Trigger n8n workflow
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

    const filteredWorkflows = activeTab === "pending"
        ? workflows.filter(w => w.status === "pending_approval")
        : activeTab === "approved"
            ? workflows.filter(w => w.status === "approved" || w.status === "completed")
            : workflows;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">⚡ Automation & Workflows</h2>
                    <p className="text-muted-foreground">
                        Request social media posts, uploads, and automated workflows
                    </p>
                </div>
                {view === "list" && (
                    <div className="flex gap-2">
                        {WORKFLOW_OPTIONS.map((opt) => (
                            <Button
                                key={opt.type}
                                variant="outline"
                                onClick={() => handleCreateNew(opt.type)}
                            >
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
                            <TabsTrigger value="pending">
                                Pending ({pendingCount})
                            </TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                        </TabsList>

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

                {/* Quick Stats */}
                {view === "list" && (
                    <div className="grid gap-4 md:grid-cols-4 mt-8">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{workflows.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-600">
                                    Pending Approval
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-green-600">
                                    Approved
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {workflows.filter(w => w.status === "approved" || w.status === "completed").length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Telegram Previews
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {workflows.filter(w => w.telegramPreviewSent).length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </RoleGate>
        </div>
    );
}
