"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import {
    ChatMessage as ChatMessageType,
    getAIResponse,
    createUserMessage,
    INITIAL_MESSAGE,
    executeAction,
    getChatSessions,
    createChatSession,
    addMessageToSession,
    isOpenRouterConfigured,
    getOpenRouterResponse,
} from "@/lib/ai";

export function ChatWindow() {
    const [initialChatState] = useState(() => {
        const sessions = getChatSessions();
        if (sessions.length > 0) {
            const lastSession = sessions[0];
            return {
                sessionId: lastSession.id,
                messages: lastSession.messages.length > 0 ? lastSession.messages : [INITIAL_MESSAGE],
            };
        }

        const newSession = createChatSession();
        return {
            sessionId: newSession.id,
            messages: [INITIAL_MESSAGE],
        };
    });
    const [sessionId, setSessionId] = useState<string>(initialChatState.sessionId);
    const [messages, setMessages] = useState<ChatMessageType[]>(initialChatState.messages);
    const [isLoading, setIsLoading] = useState(false);
    const [useRealAI, setUseRealAI] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(async (content: string) => {
        // Add user message
        const userMessage = createUserMessage(content);
        setMessages((prev) => [...prev, userMessage]);

        // Persist user message
        if (sessionId) {
            addMessageToSession(sessionId, userMessage);
        }

        setIsLoading(true);

        try {
            // Get AI response - use OpenRouter if configured and enabled
            let aiResponse: ChatMessageType;

            if (useRealAI && isOpenRouterConfigured()) {
                aiResponse = await getOpenRouterResponse(content, messages);
            } else {
                aiResponse = await getAIResponse(content);
            }

            setMessages((prev) => [...prev, aiResponse]);

            // Persist AI response
            if (sessionId) {
                addMessageToSession(sessionId, aiResponse);
            }
        } catch (error) {
            console.error("AI Error:", error);
            const errorMsg: ChatMessageType = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, messages, useRealAI]);

    const handleActionClick = useCallback(async (actionId: string) => {
        // Find the action in messages
        const action = messages
            .flatMap((m) => m.actions || [])
            .find((a) => a.id === actionId);

        if (!action) return;

        setIsLoading(true);

        try {
            const result = await executeAction(action);

            // Add result message
            const resultMsg: ChatMessageType = {
                id: `action-${Date.now()}`,
                role: "assistant",
                content: result.success
                    ? `✅ ${result.message}`
                    : `❌ ${result.message}`,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, resultMsg]);

            if (sessionId) {
                addMessageToSession(sessionId, resultMsg);
            }
        } catch (error) {
            console.error("Action error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [messages, sessionId]);

    const handleNewChat = useCallback(() => {
        const newSession = createChatSession();
        setSessionId(newSession.id);
        setMessages([INITIAL_MESSAGE]);
    }, []);

    return (
        <Card className="flex flex-col h-[600px]">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        🤖 AI Assistant
                        {useRealAI && isOpenRouterConfigured() && (
                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">
                                Live AI
                            </span>
                        )}
                    </CardTitle>
                    <div className="flex gap-2">
                        {isOpenRouterConfigured() && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUseRealAI(!useRealAI)}
                            >
                                {useRealAI ? "🔴 Live" : "⚪ Mock"}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleNewChat}>
                            + New
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4">
                {messages.map((message) => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                        onActionClick={handleActionClick}
                    />
                ))}
                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">AI sedang mengetik</span>
                            <LoadingDots />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
                <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>
        </Card>
    );
}

export default ChatWindow;
