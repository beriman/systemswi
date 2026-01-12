"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MessageCircle, Send, Loader2, Bot, User } from "lucide-react";

// Types
interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

// Configuration
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL || "";
const SESSION_KEY = "swi_chat_session";

// Generate unique ID
function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create session ID
function getSessionId(): string {
    if (typeof window === "undefined") return generateSessionId();

    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
}

// Initial welcome message
const WELCOME_MESSAGE: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: "Halo! 👋 Saya asisten virtual Sensasi Wangi Indonesia. Ada yang bisa saya bantu hari ini?\n\nAnda bisa bertanya tentang:\n• Produk & layanan kami\n• Kerjasama & partnership\n• Event & workshop\n• Informasi umum lainnya",
    timestamp: new Date().toISOString(),
};

export function FloatingChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(getSessionId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Send message to n8n webhook
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: generateId(),
            role: "user",
            content: content.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            // Call n8n webhook
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId,
                    message: content.trim(),
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();

            // Add assistant response
            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: "assistant",
                content: data.response || data.message || "Maaf, terjadi kesalahan. Silakan coba lagi.",
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);

            // Fallback response if n8n is not available
            const errorMessage: ChatMessage = {
                id: generateId(),
                role: "assistant",
                content: N8N_WEBHOOK_URL
                    ? "Maaf, sedang ada gangguan. Silakan hubungi kami via WhatsApp di +62 811-855-6688."
                    : "Chat AI sedang dalam pengembangan. Silakan hubungi kami via WhatsApp di +62 811-855-6688 untuk bantuan langsung.",
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, sessionId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(inputValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    return (
        <>
            {/* Chat Popup */}
            {isOpen && (
                <Card className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)] flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <CardHeader className="border-b p-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <span className="block font-semibold">SWI Assistant</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {isLoading ? "Mengetik..." : "Online"}
                                    </span>
                                </div>
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${message.role === "user"
                                            ? "bg-primary"
                                            : "bg-gradient-to-br from-amber-500 to-orange-600"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="w-4 h-4 text-primary-foreground" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-white" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${message.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted rounded-tl-sm"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <span className="text-[10px] opacity-60 mt-1 block">
                                        {new Date(message.timestamp).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </CardContent>

                    {/* Input */}
                    <div className="border-t p-4 flex-shrink-0">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ketik pesan..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!inputValue.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </form>
                        <p className="text-[10px] text-muted-foreground text-center mt-2">
                            Powered by AI • Sensasi Wangi Indonesia
                        </p>
                    </div>
                </Card>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen
                        ? "bg-muted text-muted-foreground"
                        : "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                    }`}
                title={isOpen ? "Tutup chat" : "Chat dengan kami"}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <MessageCircle className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">1</span>
                        </span>
                    </>
                )}
            </button>
        </>
    );
}

export default FloatingChatWidget;
