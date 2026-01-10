// PDF Export utility using browser print (jsPDF alternative)
// Note: For MVP, we use browser's Print to PDF functionality
// For production, consider adding jsPDF or @react-pdf/renderer

import type { GeneratedDocument } from "./types";

interface PDFExportOptions {
    title: string;
    letterNumber?: string;
    content: string;
}

// Export to PDF using print dialog
export function exportToPDF(options: PDFExportOptions): void {
    const { title, letterNumber, content } = options;

    // Create print window with styled content
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Please allow popups to export PDF");
        return;
    }

    const styledContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}${letterNumber ? ` - ${letterNumber}` : ""}</title>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          max-width: 21cm;
          margin: 0 auto;
          padding: 40px;
        }
        h1 {
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 24px;
          text-transform: uppercase;
        }
        h2 {
          font-size: 12pt;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
          margin-top: 20px;
          margin-bottom: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #f0f0f0;
          font-weight: bold;
        }
        hr {
          border: none;
          border-top: 1px solid #000;
          margin: 24px 0;
        }
        strong, b {
          font-weight: bold;
        }
        .header-info {
          margin-bottom: 20px;
        }
        .signature-area {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${formatContentToHTML(content)}
    </body>
    </html>
  `;

    printWindow.document.write(styledContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
        printWindow.print();
    };
}

// Convert markdown-like content to HTML
function formatContentToHTML(content: string): string {
    return content
        // Headers
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Horizontal rules
        .replace(/^---$/gm, "<hr>")
        // Tables (simple markdown tables)
        .replace(/^\|(.+)\|$/gm, (match, cells) => {
            const cellArray = cells.split("|").map((c: string) => c.trim());
            const isHeader = match.includes("---");
            if (isHeader) return "";
            const tag = cellArray[0].includes("---") ? "th" : "td";
            return `<tr>${cellArray.map((c: string) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
        })
        // Line breaks
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>")
        // Wrap in paragraph
        .replace(/^(.+)$/gm, "<p>$1</p>")
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, "")
        .replace(/<p><br><\/p>/g, "");
}

// Generate document ID
export function generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create GeneratedDocument from form data
export function createGeneratedDocument(
    type: GeneratedDocument["type"],
    title: string,
    content: string,
    letterNumber?: string,
    eventId?: string
): GeneratedDocument {
    return {
        id: generateDocumentId(),
        type,
        title,
        content,
        letterNumber,
        createdAt: new Date().toISOString(),
        createdBy: "current-user", // Would be actual user ID
        eventId,
    };
}
