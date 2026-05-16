"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import type { Feature } from "@/lib/auth/permissions";

interface NavItem {
    label: string;
    href: string;
    icon: string;
    feature: Feature;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/workspace-dashboard", icon: "OV", feature: "dashboard:overview" },
    { label: "Events", href: "/events", icon: "EV", feature: "events" },
    { label: "Documents", href: "/documents", icon: "DO", feature: "documents" },
    { label: "Reports", href: "/reports", icon: "RP", feature: "reports" },
    { label: "Drive", href: "/drive", icon: "DR", feature: "drive" },
    { label: "Sheets", href: "/sheets", icon: "SH", feature: "drive" },
    { label: "Automation", href: "/automation", icon: "AU", feature: "automation" },
    { label: "AI", href: "/ai", icon: "AI", feature: "ai-features" },
    { label: "Settings", href: "/settings", icon: "ST", feature: "settings" },
];

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { hasAccess, roleLabel } = usePermissions();
    const visibleItems = NAV_ITEMS.filter((item) => hasAccess(item.feature));

    return (
        <aside
            className={cn(
                "flex flex-col bg-card border-r transition-all duration-200",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <div className="h-16 flex items-center justify-between px-4 border-b">
                {!collapsed && (
                    <Link href="/workspace-dashboard" className="flex items-center gap-2">
                        <Image src="/logo-swi.png" alt="Logo SWI" width={32} height={32} />
                        <span className="font-bold text-lg">System SWI</span>
                    </Link>
                )}
                {collapsed && (
                    <Link href="/workspace-dashboard">
                        <Image src="/logo-swi.png" alt="Logo SWI" width={32} height={32} />
                    </Link>
                )}
                <button
                    onClick={onToggle}
                    className="p-2 rounded-md hover:bg-accent"
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    {collapsed ? ">" : "<"}
                </button>
            </div>

            <nav className="flex-1 p-2 space-y-1">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="text-xs font-semibold">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                {!collapsed && (
                    <p className="text-xs text-muted-foreground">
                        Role: <span className="font-medium">{roleLabel}</span>
                    </p>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
