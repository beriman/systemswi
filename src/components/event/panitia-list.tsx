"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panitia, DIVISION_LABELS } from "@/lib/event";

interface PanitiaListProps {
    panitia: Panitia[];
    onSelect?: (p: Panitia) => void;
}

export function PanitiaList({ panitia, onSelect }: PanitiaListProps) {
    if (panitia.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                <p>Belum ada panitia yang ditugaskan</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {panitia.map((p) => (
                <Card
                    key={p.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onSelect?.(p)}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">{p.userName}</CardTitle>
                            <span className={`text-xs px-2 py-0.5 rounded ${p.ktpStatus === "verified" ? "bg-green-500/20 text-green-500" :
                                    p.ktpStatus === "uploaded" ? "bg-yellow-500/20 text-yellow-500" :
                                        "bg-gray-500/20 text-gray-500"
                                }`}>
                                KTP: {p.ktpStatus}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{DIVISION_LABELS[p.division]}</p>
                        <p className="text-xs text-muted-foreground">{p.role === "ketua" ? "👑 Ketua" : "👤 Anggota"}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default PanitiaList;
