"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteInfo {
    code: string;
    status: string;
    createdByName: string;
    accessScope: string[];
    expiresAt: string;
    email: string | null;
}

export default function InviteAcceptPage() {
    const params = useParams();
    const code = params.code as string;

    const [invite, setInvite] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInvite() {
            try {
                const response = await fetch(`/api/invites/${code}`);
                if (!response.ok) {
                    const data = await response.json();
                    setError(data.error || "Invite not found");
                    return;
                }
                const data = await response.json();
                setInvite(data.invite);
            } catch (err) {
                setError("Failed to load invite");
            } finally {
                setLoading(false);
            }
        }

        if (code) {
            fetchInvite();
        }
    }, [code]);

    const handleAcceptInvite = () => {
        // Store invite code in session storage for OAuth callback
        sessionStorage.setItem("pendingInviteCode", code);
        // Redirect to Google OAuth
        window.location.href = "/api/auth/google";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading invite...</div>
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-red-600">Invite Error</CardTitle>
                        <CardDescription>{error || "Invite not found"}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button variant="outline" onClick={() => window.location.href = "/"}>
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (invite.status !== "pending") {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Invite {invite.status}</CardTitle>
                        <CardDescription>
                            This invite has already been {invite.status}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button variant="outline" onClick={() => window.location.href = "/login"}>
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isExpired = new Date(invite.expiresAt) < new Date();

    if (isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-amber-600">Invite Expired</CardTitle>
                        <CardDescription>
                            This invite has expired. Please request a new one.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>You&apos;re Invited!</CardTitle>
                    <CardDescription>
                        {invite.createdByName} has invited you to join System SWI as a Freelancer.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm space-y-2">
                        <p className="font-medium">Access granted to:</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                            {invite.accessScope.map((scope) => (
                                <li key={scope} className="capitalize">{scope.replace("-", " ")}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>

                    <Button onClick={handleAcceptInvite} className="w-full" size="lg">
                        Accept Invite with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
