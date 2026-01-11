import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
    return (
        <div
            className={cn(
                "animate-spin rounded-full border-primary border-t-transparent",
                sizeClasses[size],
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

interface LoadingOverlayProps {
    message?: string;
    className?: string;
}

export function LoadingOverlay({ message = "Loading...", className }: LoadingOverlayProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center",
                className
            )}
        >
            <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
        </div>
    );
}

interface LoadingDotsProps {
    className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
    );
}

interface LoadingCardProps {
    title?: string;
    description?: string;
    className?: string;
}

export function LoadingCard({ title = "Loading", description, className }: LoadingCardProps) {
    return (
        <div className={cn("bg-card border rounded-lg p-6 flex flex-col items-center gap-4", className)}>
            <Spinner size="lg" />
            <div className="text-center">
                <h3 className="font-semibold text-lg">{title}</h3>
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
        </div>
    );
}

interface ProgressBarProps {
    value: number; // 0-100
    className?: string;
    showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel = true }: ProgressBarProps) {
    const clampedValue = Math.min(Math.max(value, 0), 100);

    return (
        <div className={cn("w-full", className)}>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-muted-foreground mt-1 text-center">
                    {clampedValue}%
                </p>
            )}
        </div>
    );
}

interface InlineSpinnerProps {
    text?: string;
    className?: string;
}

export function InlineSpinner({ text = "Loading", className }: InlineSpinnerProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Spinner size="sm" />
            <span className="text-sm text-muted-foreground">{text}</span>
        </div>
    );
}
