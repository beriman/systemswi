// AI Priority Response system
import type { AIPriority, ChatMessage } from "./types";

// Priority keywords detection
const PRIORITY_KEYWORDS: Record<AIPriority, string[]> = {
    urgent: ["urgent", "segera", "darurat", "asap", "sekarang", "hari ini", "deadline"],
    high: ["penting", "cepat", "prioritas", "harus", "butuh"],
    normal: [],
    low: ["nanti", "santai", "kalau sempat", "tidak buru-buru"],
};

// Detect priority from message
export function detectPriority(message: string): AIPriority {
    const lowerMessage = message.toLowerCase();

    for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
        if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
            return priority as AIPriority;
        }
    }

    return "normal";
}

// Get priority emoji
export function getPriorityEmoji(priority: AIPriority): string {
    switch (priority) {
        case "urgent": return "🔴";
        case "high": return "🟠";
        case "normal": return "🟢";
        case "low": return "⚪";
    }
}

// Get priority label
export function getPriorityLabel(priority: AIPriority): string {
    switch (priority) {
        case "urgent": return "Urgent";
        case "high": return "High Priority";
        case "normal": return "Normal";
        case "low": return "Low Priority";
    }
}
