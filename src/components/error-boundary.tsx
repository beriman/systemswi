/**
 * Reusable Error Boundary Component
 * 
 * Wrap around components that might throw errors to provide
 * graceful error handling and reporting.
 */

"use client";

import React, { Component, ReactNode } from "react";
import { logger } from "@/lib/monitoring/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to monitoring
        logger.exception(error, {
            componentStack: errorInfo.componentStack,
            location: "error-boundary-component",
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <Card className="my-4">
                    <CardHeader>
                        <CardTitle className="text-red-600">Component Error</CardTitle>
                        <CardDescription>
                            This component encountered an error and couldn&apos;t be displayed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                                <p className="text-xs font-mono text-red-800">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            variant="outline"
                            size="sm"
                        >
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}
