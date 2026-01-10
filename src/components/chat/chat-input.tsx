"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startVoiceRecognition, isSpeechRecognitionSupported } from "@/lib/ai";

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading?: boolean;
    placeholder?: string;
}

export function ChatInput({ onSend, isLoading, placeholder = "Ketik pesan..." }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [stopListening, setStopListening] = useState<(() => void) | null>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSend(message.trim());
            setMessage("");
        }
    };

    const handleVoiceClick = () => {
        if (isListening && stopListening) {
            stopListening();
            setIsListening(false);
            setStopListening(null);
            return;
        }

        const stop = startVoiceRecognition(
            (transcript) => {
                setMessage((prev) => prev + (prev ? " " : "") + transcript);
            },
            (error) => {
                console.error("Voice error:", error);
                setIsListening(false);
            },
            () => {
                setIsListening(false);
            }
        );

        if (stop) {
            setIsListening(true);
            setStopListening(() => stop);
        }
    };

    const voiceSupported = isSpeechRecognitionSupported();

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isListening ? "Mendengarkan..." : placeholder}
                disabled={isLoading}
                className="flex-1"
            />
            {voiceSupported && (
                <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    onClick={handleVoiceClick}
                    disabled={isLoading}
                >
                    {isListening ? "⏹️" : "🎤"}
                </Button>
            )}
            <Button type="submit" disabled={!message.trim() || isLoading}>
                {isLoading ? "⏳" : "📤"}
            </Button>
        </form>
    );
}

export default ChatInput;
