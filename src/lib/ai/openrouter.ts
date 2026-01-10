// OpenRouter AI Integration
import type { ChatMessage } from "./types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// System prompt for SWI assistant
const SYSTEM_PROMPT = `Kamu adalah AI Assistant untuk System WI (Wedding/Event Organizer).

Kamu bisa membantu dengan:
- Membuat dokumen (RAB, Proposal, Laporan)
- Mengelola file di Google Drive
- Menganalisis data dari Spreadsheet
- Mengautomasi workflow

Gunakan bahasa Indonesia yang ramah dan profesional.
Berikan respons yang singkat dan actionable.

Jika diminta membuat RAB atau proposal, tanyakan detail yang diperlukan terlebih dahulu.
Format respons menggunakan markdown untuk readability.`;

interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenRouterResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
    error?: {
        message: string;
    };
}

// Generate unique ID
function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get AI response from OpenRouter
export async function getOpenRouterResponse(
    userMessage: string,
    chatHistory: ChatMessage[] = [],
    apiKey?: string
): Promise<ChatMessage> {
    const key = apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    if (!key) {
        // Fallback to mock if no API key
        console.warn("No OpenRouter API key, using mock response");
        const { getAIResponse } = await import("./mock-responses");
        return getAIResponse(userMessage);
    }

    try {
        // Build messages array
        const messages: OpenRouterMessage[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory.slice(-10).map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
            { role: "user", content: userMessage },
        ];

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages,
                max_tokens: 1000,
                temperature: 0.7,
            }),
        });

        const data: OpenRouterResponse = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const content = data.choices?.[0]?.message?.content || "Maaf, tidak ada respons.";

        return {
            id: generateId(),
            role: "assistant",
            content,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("OpenRouter error:", error);

        return {
            id: generateId(),
            role: "assistant",
            content: `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}. Silakan coba lagi.`,
            timestamp: new Date().toISOString(),
        };
    }
}

// Check if OpenRouter is configured
export function isOpenRouterConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
}
