"use client";

import { WorkflowRequest, WORKFLOW_TYPE_LABELS, WORKFLOW_STATUS_LABELS } from "@/lib/workflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkflowCardProps {
    workflow: WorkflowRequest;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    onPreview?: (id: string) => void;
}

function getStatusColor(status: WorkflowRequest["status"]): string {
    switch (status) {
        case "approved": case "completed": return "bg-green-500/20 text-green-600";
        case "rejected": case "failed": return "bg-red-500/20 text-red-600";
        case "pending_approval": return "bg-yellow-500/20 text-yellow-600";
        case "processing": return "bg-blue-500/20 text-blue-600";
        default: return "bg-gray-500/20 text-gray-600";
    }
}

function getTypeIcon(type: WorkflowRequest["type"]): string {
    switch (type) {
        case "instagram_post": return "📸";
        case "youtube_upload": return "📹";
        case "telegram_broadcast": return "📢";
        case "email_campaign": return "📧";
        case "document_generation": return "📄";
        default: return "⚡";
    }
}

export function WorkflowCard({ workflow, onApprove, onReject, onPreview }: WorkflowCardProps) {
    const isPending = workflow.status === "pending_approval";

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTypeIcon(workflow.type)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(workflow.status)}`}>
                            {WORKFLOW_STATUS_LABELS[workflow.status]}
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {new Date(workflow.createdAt).toLocaleDateString("id-ID")}
                    </span>
                </div>
                <CardTitle className="text-lg">{workflow.title}</CardTitle>
                <CardDescription>{WORKFLOW_TYPE_LABELS[workflow.type]}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>

                {workflow.rejectionReason && (
                    <p className="text-sm text-red-500 mb-4">
                        ❌ Rejected: {workflow.rejectionReason}
                    </p>
                )}

                {workflow.approvedBy && (
                    <p className="text-xs text-green-600 mb-4">
                        ✅ Approved by {workflow.approvedBy}
                    </p>
                )}

                <div className="flex gap-2">
                    {onPreview && (
                        <Button variant="outline" size="sm" onClick={() => onPreview(workflow.id)}>
                            👁️ Preview
                        </Button>
                    )}
                    {isPending && onApprove && (
                        <Button size="sm" onClick={() => onApprove(workflow.id)}>
                            ✅ Approve
                        </Button>
                    )}
                    {isPending && onReject && (
                        <Button variant="destructive" size="sm" onClick={() => onReject(workflow.id)}>
                            ❌ Reject
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default WorkflowCard;
