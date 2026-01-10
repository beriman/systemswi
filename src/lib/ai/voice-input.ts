// Voice input handler
export interface VoiceInputState {
    isListening: boolean;
    transcript: string;
    error: string | null;
}

// Check if browser supports speech recognition
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

// Start voice recognition
export function startVoiceRecognition(
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
): (() => void) | null {
    if (!isSpeechRecognitionSupported()) {
        onError("Speech recognition not supported in this browser");
        return null;
    }

    // @ts-expect-error - webkitSpeechRecognition is not in types
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "id-ID"; // Indonesian
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionEvent) => {
        onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
        onEnd();
    };

    recognition.start();

    // Return stop function
    return () => {
        recognition.stop();
    };
}

// Speech recognition event types
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    error?: string;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}
