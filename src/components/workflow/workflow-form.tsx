"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WorkflowType } from "@/lib/workflow";

interface WorkflowFormProps {
    type: WorkflowType;
    onSubmit: (data: Record<string, string>) => void;
    onCancel: () => void;
}

export function WorkflowForm({ type, onSubmit, onCancel }: WorkflowFormProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderFields = () => {
        switch (type) {
            case "instagram_post":
                return (
                    <>
                        <div className="space-y-2">
                            <Label>Caption</Label>
                            <Textarea
                                value={formData.caption || ""}
                                onChange={(e) => handleChange("caption", e.target.value)}
                                placeholder="Write your Instagram caption..."
                                rows={4}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                                value={formData.imageUrl || ""}
                                onChange={(e) => handleChange("imageUrl", e.target.value)}
                                placeholder="https://drive.google.com/..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hashtags</Label>
                            <Input
                                value={formData.hashtags || ""}
                                onChange={(e) => handleChange("hashtags", e.target.value)}
                                placeholder="#SensasiWangi #EventOrganizer"
                            />
                        </div>
                    </>
                );

            case "youtube_upload":
                return (
                    <>
                        <div className="space-y-2">
                            <Label>Video Title</Label>
                            <Input
                                value={formData.videoTitle || ""}
                                onChange={(e) => handleChange("videoTitle", e.target.value)}
                                placeholder="Video title..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.videoDescription || ""}
                                onChange={(e) => handleChange("videoDescription", e.target.value)}
                                placeholder="Video description..."
                                rows={4}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Video URL (Google Drive)</Label>
                            <Input
                                value={formData.videoUrl || ""}
                                onChange={(e) => handleChange("videoUrl", e.target.value)}
                                placeholder="https://drive.google.com/..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Visibility</Label>
                            <select
                                value={formData.visibility || "unlisted"}
                                onChange={(e) => handleChange("visibility", e.target.value)}
                                className="w-full border rounded-md p-2"
                            >
                                <option value="public">Public</option>
                                <option value="unlisted">Unlisted</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </>
                );

            default:
                return (
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description || ""}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Describe your request..."
                            rows={4}
                            required
                        />
                    </div>
                );
        }
    };

    const typeLabels: Record<WorkflowType, { icon: string; title: string }> = {
        instagram_post: { icon: "📸", title: "Instagram Post Request" },
        youtube_upload: { icon: "📹", title: "YouTube Upload Request" },
        telegram_broadcast: { icon: "📢", title: "Telegram Broadcast" },
        email_campaign: { icon: "📧", title: "Email Campaign" },
        document_generation: { icon: "📄", title: "Document Generation" },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{typeLabels[type].icon}</span>
                    {typeLabels[type].title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Request Title</Label>
                        <Input
                            value={formData.title || ""}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="Brief title for this request"
                            required
                        />
                    </div>

                    {renderFields()}

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            📤 Submit for Approval
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default WorkflowForm;
