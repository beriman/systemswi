// Reusable PDF Export Button Component
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { exportElementToPdf, exportTextPdf, type PdfExportOptions } from "@/lib/pdf/export";

type ExportMode = "element" | "text";

interface PdfExportButtonProps {
  mode: ExportMode;
  // For element mode
  elementId?: string;
  // For text mode
  title?: string;
  sections?: { heading: string; content: string | string[] }[];
  meta?: { date?: string; company?: string };
  // Common
  fileName: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function PdfExportButton(props: PdfExportButtonProps) {
  const { mode, fileName, label = "📄 Export PDF", variant = "outline", size, className } = props;
  const [progress, setProgress] = useState<number | null>(null);

  const handleExport = useCallback(async () => {
    try {
      setProgress(0);

      if (mode === "element" && props.elementId) {
        const options: PdfExportOptions = {
          elementId: props.elementId,
          fileName,
          orientation: "portrait",
          onProgress: setProgress,
        };
        await exportElementToPdf(options);
      } else if (mode === "text" && props.title && props.sections) {
        setProgress(50);
        exportTextPdf(props.title, props.sections, fileName, props.meta);
        setProgress(100);
      }
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(`Gagal export PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setProgress(null), 1500);
    }
  }, [mode, fileName, props.elementId, props.title, props.sections, props.meta]);

  if (progress !== null) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div>
    );
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} className={className}>
      {label}
    </Button>
  );
}
