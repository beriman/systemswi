"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentTemplate, TemplateField } from "@/lib/document";
import { getEvents } from "@/lib/event";

interface DocumentFormProps {
    template: DocumentTemplate;
    onGenerate: (data: Record<string, string>) => void;
    onCancel: () => void;
}

export function DocumentForm({ template, onGenerate, onCancel }: DocumentFormProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const events = getEvents();

    const handleChange = (fieldId: string, value: string) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(formData);
    };

    const renderField = (field: TemplateField) => {
        switch (field.type) {
            case "textarea":
                return (
                    <Textarea
                        id={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={4}
                    />
                );

            case "date":
                return (
                    <Input
                        id={field.id}
                        type="date"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        required={field.required}
                    />
                );

            case "number":
                return (
                    <Input
                        id={field.id}
                        type="number"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );

            case "event":
                return (
                    <select
                        id={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className="w-full border rounded-md p-2"
                        required={field.required}
                    >
                        <option value="">Pilih Event</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.name}>
                                {event.name}
                            </option>
                        ))}
                    </select>
                );

            case "select":
                return (
                    <select
                        id={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className="w-full border rounded-md p-2"
                        required={field.required}
                    >
                        <option value="">Pilih...</option>
                        {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            default:
                return (
                    <Input
                        id={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    {template.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {template.fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id}>
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {renderField(field)}
                        </div>
                    ))}

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Batal
                        </Button>
                        <Button type="submit">
                            📄 Generate Document
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default DocumentForm;
