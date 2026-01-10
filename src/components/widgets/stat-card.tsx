import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: string;
    description?: string;
    variant?: "default" | "warning" | "success" | "danger";
    onClick?: () => void;
}

const variantStyles = {
    default: "",
    warning: "border-yellow-500/50 bg-yellow-500/5",
    success: "border-green-500/50 bg-green-500/5",
    danger: "border-red-500/50 bg-red-500/5",
};

export function StatCard({
    title,
    value,
    icon,
    description,
    variant = "default",
    onClick,
}: StatCardProps) {
    return (
        <Card
            className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                variantStyles[variant],
                onClick && "hover:scale-[1.02]"
            )}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && <span className="text-2xl">{icon}</span>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default StatCard;
