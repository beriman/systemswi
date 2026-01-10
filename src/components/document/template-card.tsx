"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentTemplate } from "@/lib/document";

interface TemplateCardProps {
    template: DocumentTemplate;
    onSelect: (template: DocumentTemplate) => void;
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(template)}>
            <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{template.fields.length} field</span>
                    <Button size="sm" variant="outline">
                        Buat →
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default TemplateCard;
