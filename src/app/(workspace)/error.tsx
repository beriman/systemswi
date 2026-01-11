"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/monitoring/logger";
import Link from "next/link";

export default function WorkspaceError({
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
            location: "workspace-error-boundary",
        });
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-red-600">Workspace Error</CardTitle>
                    <CardDescription>
                        An error occurred in the workspace. Our team has been notified.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === "development" && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-xs font-mono text-red-800">{error.message}</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={reset} className="flex-1">
                            Try again
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
