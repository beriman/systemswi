// Document persistence - localStorage for letter counter and document history
import type { GeneratedDocument } from "./types";

const LETTER_COUNTER_KEY = "swi_letter_counter";
const DOCUMENT_HISTORY_KEY = "swi_document_history";
const MAX_HISTORY = 50;

// Get letter counter from localStorage
export function getLetterCounter(): number {
    if (typeof window === "undefined") return 1;

    try {
        const stored = localStorage.getItem(LETTER_COUNTER_KEY);
        return stored ? parseInt(stored, 10) : 1;
    } catch {
        return 1;
    }
}

// Increment and save letter counter
export function incrementLetterCounter(): number {
    const current = getLetterCounter();
    const next = current + 1;

    if (typeof window !== "undefined") {
        localStorage.setItem(LETTER_COUNTER_KEY, String(next));
    }

    return current;
}

// Reset letter counter (for new year)
export function resetLetterCounter(): void {
    if (typeof window !== "undefined") {
        localStorage.setItem(LETTER_COUNTER_KEY, "1");
    }
}

// Get document history
export function getDocumentHistory(): GeneratedDocument[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(DOCUMENT_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Save document to history
export function saveDocumentToHistory(doc: GeneratedDocument): void {
    if (typeof window === "undefined") return;

    const history = getDocumentHistory();
    history.unshift(doc);

    // Keep only last N documents
    const trimmed = history.slice(0, MAX_HISTORY);
    localStorage.setItem(DOCUMENT_HISTORY_KEY, JSON.stringify(trimmed));
}

// Get document by ID
export function getDocumentById(id: string): GeneratedDocument | null {
    const history = getDocumentHistory();
    return history.find((doc) => doc.id === id) || null;
}

// Delete document from history
export function deleteDocumentFromHistory(id: string): void {
    if (typeof window === "undefined") return;

    const history = getDocumentHistory().filter((doc) => doc.id !== id);
    localStorage.setItem(DOCUMENT_HISTORY_KEY, JSON.stringify(history));
}

// Clear all document history
export function clearDocumentHistory(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(DOCUMENT_HISTORY_KEY);
}
