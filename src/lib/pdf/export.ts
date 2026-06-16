// Client-side PDF Export Utility
// Uses jsPDF + html2canvas for reliable browser-based PDF generation
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export type PdfOrientation = "portrait" | "landscape";
export type PdfPageSize = "a4" | "letter" | "legal";

export interface PdfExportOptions {
  elementId: string;
  fileName: string;
  orientation?: PdfOrientation;
  pageSize?: PdfPageSize;
  margin?: number;
  scale?: number;
  onProgress?: (progress: number) => void;
}

const MM_PER_INCH = 25.4;

function getPageDimensions(pageSize: PdfPageSize, orientation: PdfOrientation) {
  const sizes: Record<PdfPageSize, { w: number; h: number }> = {
    a4: { w: 210, h: 297 },
    letter: { w: 215.9, h: 279.4 },
    legal: { w: 215.9, h: 355.6 },
  };
  const size = sizes[pageSize];
  return orientation === "portrait"
    ? { width: size.w, height: size.h }
    : { width: size.h, height: size.w };
}

export async function exportElementToPdf(options: PdfExportOptions): Promise<string> {
  const {
    elementId,
    fileName,
    orientation = "portrait",
    pageSize = "a4",
    margin = 10,
    scale = 2,
    onProgress,
  } = options;

  onProgress?.(10);

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  onProgress?.(25);

  // Clone element for rendering (avoid visible changes)
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.width = `${element.scrollWidth}px`;
  clone.style.background = "#ffffff";
  document.body.appendChild(clone);

  onProgress?.(40);

  try {
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: clone.scrollWidth,
      height: clone.scrollHeight,
    });

    onProgress?.(65);

    const { width: pageW, height: pageH } = getPageDimensions(pageSize, orientation);
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: [pageW, pageH],
    });

    const imgWidth = contentW;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = canvas.height;
    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
    }

    // First page
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      margin,
      position,
      imgWidth,
      Math.min(imgHeight, contentH)
    );
    heightLeft -= contentH;

    // Additional pages if content overflows
    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(
        pageCanvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        margin,
        position,
        imgWidth,
        Math.min(heightLeft, contentH)
      );
      heightLeft -= contentH;
    }

    onProgress?.(90);

    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    pdf.save(fileName);

    onProgress?.(100);
    return url;
  } finally {
    document.body.removeChild(clone);
  }
}

// Export a simple text-based document (for reports, RAB, etc)
export function exportTextPdf(
  title: string,
  sections: { heading: string; content: string | string[] }[],
  fileName: string,
  meta?: { date?: string; company?: string }
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, pageW / 2, y, { align: "center" });
  y += 10;

  // Meta
  if (meta) {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    if (meta.company) pdf.text(meta.company, pageW / 2, y, { align: "center" });
    y += 5;
    if (meta.date) pdf.text(meta.date, pageW / 2, y, { align: "center" });
    y += 8;
  }

  // Divider
  pdf.setDrawColor(200);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  for (const section of sections) {
    // Check page break
    if (y > 270) {
      pdf.addPage();
      y = margin;
    }

    // Section heading
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.text(section.heading, margin, y);
    y += 7;

    // Section content
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const lines = Array.isArray(section.content)
      ? section.content
      : section.content.split("\n");

    for (const line of lines) {
      if (y > 280) {
        pdf.addPage();
        y = margin;
      }
      const split = pdf.splitTextToSize(line, contentW) as string[];
      pdf.text(split, margin, y);
      y += split.length * 5;
    }
    y += 5;
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${i} of ${pageCount} — Generated by SWI System`,
      pageW / 2,
      290,
      { align: "center" }
    );
  }

  pdf.save(fileName);
}
