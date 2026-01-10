// AI Learning / Self-Annealing system

export interface LearningEntry {
    id: string;
    input: string;
    output: string;
    feedback: "positive" | "negative" | null;
    timestamp: string;
}

export interface AIMemory {
    patterns: { pattern: string; response: string; confidence: number }[];
    corrections: { original: string; corrected: string }[];
}

// In-memory learning store
const learningStore: LearningEntry[] = [];
const aiMemory: AIMemory = {
    patterns: [],
    corrections: [],
};

// Log interaction for learning
export function logInteraction(
    input: string,
    output: string
): string {
    const entry: LearningEntry = {
        id: `learn-${Date.now()}`,
        input,
        output,
        feedback: null,
        timestamp: new Date().toISOString(),
    };
    learningStore.push(entry);
    return entry.id;
}

// Record feedback
export function recordFeedback(
    entryId: string,
    feedback: "positive" | "negative"
): void {
    const entry = learningStore.find((e) => e.id === entryId);
    if (entry) {
        entry.feedback = feedback;

        // If positive, add to patterns with high confidence
        if (feedback === "positive") {
            aiMemory.patterns.push({
                pattern: entry.input.toLowerCase(),
                response: entry.output,
                confidence: 0.9,
            });
        }
    }
}

// Get relevant learned pattern
export function getLearnedResponse(input: string): string | null {
    const lowerInput = input.toLowerCase();

    const match = aiMemory.patterns.find(
        (p) => lowerInput.includes(p.pattern) && p.confidence > 0.7
    );

    return match?.response || null;
}

// Get learning stats
export function getLearningStats(): {
    totalInteractions: number;
    positiveFeedback: number;
    negativeFeedback: number;
    patternsLearned: number;
} {
    return {
        totalInteractions: learningStore.length,
        positiveFeedback: learningStore.filter((e) => e.feedback === "positive").length,
        negativeFeedback: learningStore.filter((e) => e.feedback === "negative").length,
        patternsLearned: aiMemory.patterns.length,
    };
}
