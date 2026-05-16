/**
 * Test Page for Sentry Error Tracking
 * 
 * This page provides buttons to test different types of errors
 * and verify Sentry integration is working correctly.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger, setUserContext } from "@/lib/monitoring/logger";
import { ErrorBoundary } from "@/components/error-boundary";

const ErrorComponent: React.FC = () => {
    throw new Error("Test error from ErrorBoundary component");
};

export default function SentryTestPage() {
    const [showError, setShowError] = useState(false);
    const [testResults, setTestResults] = useState<string[]>([]);

    const addResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Test 1: Manual exception
    const testException = () => {
        try {
            throw new Error("Test manual exception");
        } catch (error) {
            logger.exception(error as Error, {
                test: "manual-exception",
                source: "test-page"
            });
            addResult("✅ Manual exception sent to Sentry");
        }
    };

    // Test 2: Error log
    const testErrorLog = () => {
        logger.error("Test error log", {
            test: "error-log",
            severity: "high",
            component: "sentry-test-page"
        });
        addResult("✅ Error log sent to Sentry");
    };

    // Test 3: Warning log
    const testWarningLog = () => {
        logger.warn("Test warning log", {
            test: "warning-log",
            threshold: 80
        });
        addResult("✅ Warning log sent (production only)");
    };

    // Test 4: Set user context
    const testUserContext = () => {
        setUserContext({
            id: "test-user-123",
            email: "test@example.com",
            name: "Test User"
        });
        addResult("✅ User context set");
    };

    // Test 5: Error boundary
    const testErrorBoundary = () => {
        setShowError(true);
        addResult("✅ Error boundary triggered");
    };

    // Test 6: Async error
    const testAsyncError = async () => {
        try {
            await new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Test async error")), 100);
            });
        } catch (error) {
            logger.exception(error as Error, {
                test: "async-error",
                async: true
            });
            addResult("✅ Async error sent to Sentry");
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Sentry Error Tracking Test</h1>
                <p className="text-muted-foreground">
                    Test different types of errors and verify they&apos;re being sent to Sentry.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Test Controls</CardTitle>
                        <CardDescription>Trigger different types of errors</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button onClick={testException} className="w-full" variant="destructive">
                            1. Test Manual Exception
                        </Button>
                        <Button onClick={testErrorLog} className="w-full" variant="destructive">
                            2. Test Error Log
                        </Button>
                        <Button onClick={testWarningLog} className="w-full" variant="outline">
                            3. Test Warning Log
                        </Button>
                        <Button onClick={testUserContext} className="w-full" variant="secondary">
                            4. Set User Context
                        </Button>
                        <Button onClick={testErrorBoundary} className="w-full" variant="destructive">
                            5. Test Error Boundary
                        </Button>
                        <Button onClick={testAsyncError} className="w-full" variant="destructive">
                            6. Test Async Error
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Test Results</CardTitle>
                        <CardDescription>
                            {testResults.length === 0 ? "No tests run yet" : `${testResults.length} tests executed`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {testResults.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Click buttons to test error tracking
                            </p>
                        ) : (
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {testResults.map((result, i) => (
                                    <div key={i} className="text-xs font-mono bg-muted p-2 rounded">
                                        {result}
                                    </div>
                                ))}
                            </div>
                        )}
                        {testResults.length > 0 && (
                            <Button
                                onClick={() => setTestResults([])}
                                variant="ghost"
                                size="sm"
                                className="mt-2 w-full"
                            >
                                Clear Results
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Error Boundary Test */}
            <Card>
                <CardHeader>
                    <CardTitle>Error Boundary Test</CardTitle>
                    <CardDescription>Component will throw error when shown</CardDescription>
                </CardHeader>
                <CardContent>
                    <ErrorBoundary>
                        {showError && <ErrorComponent />}
                        {!showError && (
                            <p className="text-sm text-muted-foreground">
                                Click &quot;Test Error Boundary&quot; above to trigger component error
                            </p>
                        )}
                    </ErrorBoundary>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>How to Verify</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>1. Run tests using buttons above</p>
                    <p>2. Go to Sentry dashboard: <a href="https://sentry.io" target="_blank" rel="noopener" className="text-blue-600 hover:underline">sentry.io</a></p>
                    <p>3. Navigate to: <strong>Issues</strong> tab</p>
                    <p>4. You should see errors with tags: <code className="bg-muted px-1 rounded">test</code></p>
                    <p className="text-muted-foreground">
                        Note: In production mode, errors are sent to Sentry. In development, they&apos;re logged to console.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
