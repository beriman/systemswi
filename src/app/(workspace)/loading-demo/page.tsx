/**
 * Loading States Demo Page
 * 
 * Showcase all loading component variants
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Spinner,
    LoadingOverlay,
    LoadingDots,
    LoadingCard,
    ProgressBar,
    InlineSpinner
} from "@/components/ui/loading";

export default function LoadingDemoPage() {
    const [showOverlay, setShowOverlay] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const simulateLoading = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 2000);
    };

    const simulateProgress = () => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Loading States Demo</h1>
                <p className="text-muted-foreground">
                    Interactive showcase of all loading component variants
                </p>
            </div>

            {/* Spinners */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Spinners</CardTitle>
                    <CardDescription>Different sizes of spinning loaders</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <Spinner size="sm" />
                            <span className="text-xs">Small</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Spinner size="md" />
                            <span className="text-xs">Medium (default)</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Spinner size="lg" />
                            <span className="text-xs">Large</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Spinner size="xl" />
                            <span className="text-xs">Extra Large</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Loading Dots */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Loading Dots</CardTitle>
                    <CardDescription>Animated bouncing dots</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <LoadingDots />
                        <span className="text-sm text-muted-foreground">Perfect for inline loading states</span>
                    </div>
                </CardContent>
            </Card>

            {/* Inline Spinner */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Inline Spinner</CardTitle>
                    <CardDescription>Spinner with text label</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InlineSpinner text="Loading data..." />
                    <InlineSpinner text="Processing..." />
                    <div className="pt-4 border-t">
                        <Button onClick={simulateLoading} disabled={isLoading}>
                            {isLoading ? <InlineSpinner text="Loading" /> : "Trigger Loading"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Bar */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Progress Bar</CardTitle>
                    <CardDescription>For operations with known progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ProgressBar value={progress} />
                    <div className="flex gap-2">
                        <Button onClick={simulateProgress} size="sm">
                            Simulate Progress
                        </Button>
                        <Button onClick={() => setProgress(0)} variant="outline" size="sm">
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Loading Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Loading Card</CardTitle>
                    <CardDescription>Full card loading state</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <LoadingCard title="Loading content" description="Please wait..." />
                        <LoadingCard title="Processing" />
                    </div>
                </CardContent>
            </Card>

            {/* Loading Overlay */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Loading Overlay</CardTitle>
                    <CardDescription>Full-screen loading overlay with backdrop blur</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => {
                        setShowOverlay(true);
                        setTimeout(() => setShowOverlay(false), 2000);
                    }}>
                        Show Overlay (2s)
                    </Button>
                </CardContent>
            </Card>

            {/* Usage Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Examples</CardTitle>
                    <CardDescription>Code examples for each component</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-md">
                        <h4 className="font-mono text-sm mb-2">Spinner:</h4>
                        <pre className="text-xs overflow-x-auto">
                            {`import { Spinner } from "@/components/ui/loading";

<Spinner size="md" />
{isLoading && <Spinner size="lg" />}`}
                        </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                        <h4 className="font-mono text-sm mb-2">Loading Dots:</h4>
                        <pre className="text-xs overflow-x-auto">
                            {`import { LoadingDots } from "@/components/ui/loading";

<LoadingDots />
<div className="flex items-center gap-2">
  Processing <LoadingDots />
</div>`}
                        </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                        <h4 className="font-mono text-sm mb-2">Progress Bar:</h4>
                        <pre className="text-xs overflow-x-auto">
                            {`import { ProgressBar } from "@/components/ui/loading";

const [progress, setProgress] = useState(0);

<ProgressBar value={progress} showLabel />
<ProgressBar value={75} showLabel={false} />`}
                        </pre>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                        <h4 className="font-mono text-sm mb-2">Loading Overlay:</h4>
                        <pre className="text-xs overflow-x-auto">
                            {`import { LoadingOverlay } from "@/components/ui/loading";

{isProcessing && (
  <LoadingOverlay message="Processing your request..." />
)}`}
                        </pre>
                    </div>
                </CardContent>
            </Card>

            {/* Overlay Demo */}
            {showOverlay && (
                <LoadingOverlay message="Processing... (automatic close)" />
            )}
        </div>
    );
}
