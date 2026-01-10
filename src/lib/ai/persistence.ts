// Chat persistence using localStorage
import type { ChatMessage, ChatSession } from "./types";

const STORAGE_KEY = "swi_chat_history";
const MAX_SESSIONS = 10;

// Get all sessions
export function getChatSessions(): ChatSession[] {
    if (typeof window === "undefined") return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Get a specific session
export function getChatSession(id: string): ChatSession | null {
    const sessions = getChatSessions();
    return sessions.find((s) => s.id === id) || null;
}

// Save session
export function saveChatSession(session: ChatSession): void {
    if (typeof window === "undefined") return;

    const sessions = getChatSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    if (existingIndex >= 0) {
        sessions[existingIndex] = session;
    } else {
        sessions.unshift(session);
    }

    // Keep only last N sessions
    const trimmed = sessions.slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// Create new session
export function createChatSession(title?: string): ChatSession {
    const session: ChatSession = {
        id: `session-${Date.now()}`,
        title: title || "New Chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    saveChatSession(session);
    return session;
}

// Add message to session
export function addMessageToSession(sessionId: string, message: ChatMessage): void {
    const session = getChatSession(sessionId);
    if (!session) return;

    session.messages.push(message);
    session.updatedAt = new Date().toISOString();

    // Update title from first user message
    if (!session.title || session.title === "New Chat") {
        const firstUserMsg = session.messages.find((m) => m.role === "user");
        if (firstUserMsg) {
            session.title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
        }
    }

    saveChatSession(session);
}

// Delete session
export function deleteChatSession(id: string): void {
    if (typeof window === "undefined") return;

    const sessions = getChatSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Clear all sessions
export function clearAllSessions(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}
