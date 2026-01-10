"use client";

import { ChatMessage as ChatMessageType } from "@/lib/ai";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
    message: ChatMessageType;
    onActionClick?: (actionId: string) => void;
}

export function ChatMessage({ message, onActionClick }: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
            <div
                className={`max-w-[80%] rounded-lg p-4 ${isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
            >
                {/* Message content */}
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                {/* Actions */}
                {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                            <Button
                                key={action.id}
                                variant="secondary"
                                size="sm"
                                onClick={() => onActionClick?.(action.id)}
                                disabled={action.status === "running"}
                            >
                                {action.status === "running" ? "⏳" : "⚡"} {action.label}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-2 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(message.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>
        </div>
    );
}

export default ChatMessage;
