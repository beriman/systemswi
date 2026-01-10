import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon = "📂",
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <span className="text-6xl mb-4">{icon}</span>
                <h3 className="text-lg font-medium mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                        {description}
                    </p>
                )}
                {actionLabel && onAction && (
                    <Button onClick={onAction} variant="outline">
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Predefined empty states
export function EmptyFolder() {
    return (
        <EmptyState
            icon="📂"
            title="Folder kosong"
            description="Belum ada file atau folder di sini"
        />
    );
}

export function NoSearchResults() {
    return (
        <EmptyState
            icon="🔍"
            title="Tidak ditemukan"
            description="Coba kata kunci lain atau periksa ejaan"
        />
    );
}

export function NoPendingContent() {
    return (
        <EmptyState
            icon="✅"
            title="Tidak ada konten pending"
            description="Semua konten sudah diproses"
        />
    );
}

export default EmptyState;
