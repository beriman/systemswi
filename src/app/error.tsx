"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/monitoring/logger";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to monitoring
        logger.exception(error, {
            digest: error.digest,
            location: "root-error-boundary",
        });
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-red-600">Oops! Something went wrong</CardTitle>
                    <CardDescription>
                        We&apos;re sorry, but something unexpected happened. Our team has been notified.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === "development" && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-mono text-red-800">{error.message}</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={reset} className="flex-1">
                            Try again
                        </Button>
                        <Button onClick={() => window.location.href = "/"} variant="outline" className="flex-1">
                            Go home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
