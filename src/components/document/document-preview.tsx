"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DocumentPreviewProps {
    content: string;
    title: string;
    letterNumber?: string;
    onSaveToDrive?: () => void;
    onExportPDF?: () => void;
    onBack: () => void;
}

export function DocumentPreview({
    content,
    title,
    letterNumber,
    onSaveToDrive,
    onExportPDF,
    onBack,
}: DocumentPreviewProps) {
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        alert("Document copied to clipboard!");
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { text-align: center; }
              h2 { border-bottom: 1px solid #ccc; padding-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f5f5f5; }
              hr { margin: 24px 0; }
            </style>
          </head>
          <body>
            ${content.replace(/\n/g, "<br>").replace(/#{1,3}\s+(.+)/g, "<h2>$1</h2>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {letterNumber && (
                            <p className="text-sm text-muted-foreground">No: {letterNumber}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            📋 Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            🖨️ Print
                        </Button>
                        {onExportPDF && (
                            <Button variant="outline" size="sm" onClick={onExportPDF}>
                                📥 PDF
                            </Button>
                        )}
                        {onSaveToDrive && (
                            <Button variant="outline" size="sm" onClick={onSaveToDrive}>
                                ☁️ Save to Drive
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="bg-white border rounded-lg p-8 min-h-[600px] font-mono text-sm whitespace-pre-wrap">
                    {content}
                </div>
                <div className="mt-4">
                    <Button variant="ghost" onClick={onBack}>
                        ← Kembali
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default DocumentPreview;
