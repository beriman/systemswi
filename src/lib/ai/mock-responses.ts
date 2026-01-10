// Mock AI responses for MVP
import type { ChatMessage, AIAction } from "./types";

// Simulate AI response delay
const RESPONSE_DELAY = 1000;

// Mock AI responses based on keywords
const MOCK_RESPONSES: Record<string, { content: string; actions?: AIAction[] }> = {
    rab: {
        content: "Saya bisa membantu membuat RAB untuk event Anda. Silakan berikan detail event berikut:\n\n1. Nama Event\n2. Tanggal & Durasi\n3. Estimasi Jumlah Peserta\n4. Lokasi (Indoor/Outdoor)\n\nSetelah itu, saya akan generate template RAB yang sesuai.",
        actions: [
            { id: "1", type: "generate_document", label: "Generate RAB Template", status: "pending" },
        ],
    },
    proposal: {
        content: "Untuk membuat proposal, saya membutuhkan informasi berikut:\n\n1. Nama Event & Tema\n2. Latar Belakang\n3. Target Audience\n4. Budget Range\n\nApakah Anda ingin saya ambil data dari event sebelumnya sebagai referensi?",
        actions: [
            { id: "2", type: "open_drive", label: "Lihat Template Proposal", status: "pending" },
        ],
    },
    event: {
        content: "Berdasarkan data di sistem, berikut event yang sedang berjalan:\n\n📅 **Wedding Expo 2026** - 15 Mar 2026 (Planning)\n📅 **Corporate Gathering** - 20 Apr 2026 (Draft)\n📅 **Music Festival** - 10 May 2026 (Approved)\n\nApakah ada yang ingin Anda tanyakan tentang event ini?",
    },
    laporan: {
        content: "Jenis laporan apa yang Anda butuhkan?\n\n1. 📊 Laporan Keuangan Event\n2. 📋 Laporan Progress Event\n3. 📈 Laporan Performa Tim\n4. 📝 Laporan Custom\n\nPilih nomor atau deskripsikan kebutuhan Anda.",
        actions: [
            { id: "3", type: "generate_document", label: "Generate Laporan", status: "pending" },
        ],
    },
    default: {
        content: "Halo! Saya AI Assistant SWI. Saya bisa membantu Anda dengan:\n\n✨ **Document Generation** - RAB, Proposal, Laporan\n📁 **Drive Management** - Cari & kelola file\n📊 **Data Analysis** - Analisis dari Sheets\n⚡ **Automation** - Trigger workflow\n\nApa yang bisa saya bantu hari ini?",
    },
};

// Generate unique ID
function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get mock AI response
export async function getAIResponse(userMessage: string): Promise<ChatMessage> {
    await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY));

    const lowerMessage = userMessage.toLowerCase();

    let response = MOCK_RESPONSES.default;

    // Check for keywords
    if (lowerMessage.includes("rab") || lowerMessage.includes("anggaran")) {
        response = MOCK_RESPONSES.rab;
    } else if (lowerMessage.includes("proposal")) {
        response = MOCK_RESPONSES.proposal;
    } else if (lowerMessage.includes("event") || lowerMessage.includes("acara")) {
        response = MOCK_RESPONSES.event;
    } else if (lowerMessage.includes("laporan") || lowerMessage.includes("report")) {
        response = MOCK_RESPONSES.laporan;
    }

    return {
        id: generateId(),
        role: "assistant",
        content: response.content,
        timestamp: new Date().toISOString(),
        actions: response.actions,
    };
}

// Create user message
export function createUserMessage(content: string): ChatMessage {
    return {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
    };
}

// Initial greeting message
export const INITIAL_MESSAGE: ChatMessage = {
    id: "initial",
    role: "assistant",
    content: "👋 Halo! Saya AI Assistant SWI.\n\nSaya siap membantu Anda dengan:\n- 📄 Document Generation (RAB, Proposal)\n- 📁 Kelola File di Drive\n- 📊 Analisis Data\n- ⚡ Automasi Workflow\n\nSilakan ketik pertanyaan atau perintah Anda!",
    timestamp: new Date().toISOString(),
};
