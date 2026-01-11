/**
 * Page Loading Component
 * 
 * Displays a full-page loading state with optional message.
 * Used for route transitions and initial page loads.
 */

import { Spinner } from "./loading";

interface PageLoadingProps {
    message?: string;
}

export function PageLoading({ message = "Loading page..." }: PageLoadingProps) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="xl" />
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}
