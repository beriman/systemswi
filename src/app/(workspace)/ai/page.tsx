"use client";

import { ChatWindow } from "@/components/chat";
import { RoleGate } from "@/components/auth/role-gate";
import { AI_CAPABILITIES } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AIPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold">🤖 AI Assistant</h2>
                <p className="text-muted-foreground">
                    Chat dengan AI untuk bantuan dokumen & workflow
                </p>
            </div>

            {/* Content */}
            <RoleGate feature="ai-features">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Chat Window */}
                    <div className="lg:col-span-2">
                        <ChatWindow />
                    </div>

                    {/* Capabilities sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">✨ Kemampuan AI</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {AI_CAPABILITIES.map((cap, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-green-500">✓</span>
                                            {cap}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">💡 Quick Commands</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="text-sm text-muted-foreground">Coba ketik:</p>
                                <ul className="text-sm space-y-1">
                                    <li>&quot;Buat RAB untuk event&quot;</li>
                                    <li>&quot;Generate proposal&quot;</li>
                                    <li>&quot;Lihat laporan&quot;</li>
                                    <li>&quot;Status event&quot;</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </RoleGate>
        </div>
    );
}
