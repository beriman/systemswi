// PDF Export utility using jsPDF + html2canvas for real PDF generation
// Replaces the old window.open + window.print() approach

import type { GeneratedDocument } from "./types";

export interface PDFExportOptions {
  title: string;
  letterNumber?: string;
  content: string;
  filename?: string;
}

/**
 * Generate a real PDF from an HTML element ID.
 * Usage: await exportElementToPDF("invoice-print", "INV-2026-001.pdf")
 */
export async function exportElementToPDF(
  elementId: string,
  filename: string = "document.pdf"
): Promise<boolean> {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  const { default: html2canvas } = await import("html2canvas");
  const { jsPDF } = await import("jspdf");

  // Capture the element as a canvas
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = pdfWidth / imgWidth;
  const scaledHeight = imgHeight * ratio;

  let heightLeft = scaledHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
  heightLeft -= pdfHeight;

  // Additional pages if content overflows
  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(filename);
  return true;
}

/**
 * Generate PDF from markdown-like text content using jsPDF directly.
 * Used for document generator output.
 */
export async function exportContentToPDF(
  options: PDFExportOptions
): Promise<boolean> {
  const { title, letterNumber, content, filename } = options;
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper: add page if needed
  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("PT SENSI WANGI INDONESIA", margin, y);
  doc.text("Jl. Kemang Raya, Jakarta Selatan", pageWidth - margin, y, { align: "right" });
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Title
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const fullTitle = letterNumber ? `${title} — ${letterNumber}` : title;
  doc.text(fullTitle, pageWidth / 2, y, { align: "center" });
  y += 10;

  // Date line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Jakarta, ${today}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  // Separator
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Content - parse markdown-like format
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 6;
      continue;
    }

    // Horizontal rule
    if (trimmed === "---") {
      checkPageBreak(10);
      doc.setDrawColor(180, 180, 180);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      continue;
    }

    // H1
    if (trimmed.startsWith("# ")) {
      checkPageBreak(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(trimmed.replace(/^# /, ""), margin, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      continue;
    }

    // H2
    if (trimmed.startsWith("## ")) {
      checkPageBreak(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(trimmed.replace(/^## /, ""), margin, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      continue;
    }

    // H3
    if (trimmed.startsWith("### ")) {
      checkPageBreak(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(trimmed.replace(/^### /, ""), margin, y);
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      continue;
    }

    // Table row
    if (trimmed.startsWith("|")) {
      checkPageBreak(8);
      const cells = trimmed
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c && !c.match(/^-+$/));

      if (cells.length > 0) {
        const cellWidth = contentWidth / cells.length;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        cells.forEach((cell, i) => {
          doc.text(cell, margin + i * cellWidth + 1, y);
        });
        y += 7;
      }
      continue;
    }

    // Regular text - word wrap
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      doc.setFont("helvetica", "bold");
      const text = trimmed.replace(/^\*\*|\*\*$/g, "");
      const split = doc.splitTextToSize(text, contentWidth);
      checkPageBreak(split.length * 5 + 2);
      doc.text(split, margin, y);
      y += split.length * 5 + 3;
      doc.setFont("helvetica", "normal");
    } else if (trimmed.startsWith("- ")) {
      const text = trimmed.replace(/^- /, "");
      const split = doc.splitTextToSize(text, contentWidth - 6);
      checkPageBreak(split.length * 5 + 2);
      doc.text("•", margin, y);
      doc.text(split, margin + 6, y);
      y += split.length * 5 + 3;
    } else {
      const split = doc.splitTextToSize(trimmed, contentWidth);
      checkPageBreak(split.length * 5 + 2);
      doc.text(split, margin, y);
      y += split.length * 5 + 3;
    }
  }

  // Footer
  checkPageBreak(20);
  y = Math.max(y + 10, pageHeight - 25);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Dokumen ini dibuat oleh systemswi — PT Sensasi Wangi Indonesia",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  const pdfFilename = filename || `${title.replace(/\s+/g, "_")}.pdf`;
  doc.save(pdfFilename);
  return true;
}

/**
 * Legacy wrapper: exportToPDF now uses jsPDF for real PDF generation.
 * Kept for backward compatibility.
 */
export function exportToPDF(options: PDFExportOptions): void {
  // Fire and forget — async but don't block UI
  exportContentToPDF(options).catch((err) => {
    console.error("PDF export failed:", err);
    alert("Gagal mengekspor PDF. Silakan coba lagi.");
  });
}
