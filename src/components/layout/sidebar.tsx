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
    { label: "Overview", href: "/dashboard", icon: "📊", feature: "dashboard:overview" },
    { label: "Operations", href: "/operations", icon: "🧭", feature: "dashboard:overview" },
    { label: "Finance", href: "/finance", icon: "💰", feature: "dashboard:overview" },
    { label: "Produksi", href: "/production", icon: "🏭", feature: "dashboard:overview" },
    { label: "Production Analytics", href: "/production-analytics", icon: "📊", feature: "dashboard:overview" },
    { label: "Inventory", href: "/inventory", icon: "📦", feature: "dashboard:overview" },
    { label: "Procurement", href: "/procurement", icon: "🧾", feature: "dashboard:overview" },
    { label: "Reorder", href: "/reorder", icon: "📦", feature: "dashboard:overview" },
    { label: "Store Daily", href: "/store-daily", icon: "🏪", feature: "dashboard:overview" },
    { label: "E-Commerce", href: "/ecommerce", icon: "🛍️", feature: "dashboard:overview" },
    { label: "Merch TIM", href: "/merch", icon: "🏷️", feature: "dashboard:overview" },
    { label: "Compliance", href: "/compliance", icon: "✅", feature: "dashboard:overview" },
    { label: "QC", href: "/qc", icon: "🔬", feature: "qc" },
    { label: "BPOM", href: "/bpom", icon: "🏛️", feature: "dashboard:overview" },
    { label: "Alerts", href: "/alerts", icon: "🔔", feature: "dashboard:overview" },
    { label: "CRM Hub", href: "/crm", icon: "🤝", feature: "dashboard:overview" },
    { label: "Customers", href: "/customers", icon: "👥", feature: "dashboard:overview" },
    { label: "Scent Profile", href: "/scent-profile", icon: "🧪", feature: "dashboard:overview" },
    { label: "Formula", href: "/formulas", icon: "🧪", feature: "dashboard:overview" },
    { label: "Documents", href: "/documents", icon: "📄", feature: "ai-features" },
    { label: "Invoice", href: "/invoice", icon: "🧾", feature: "dashboard:overview" },
    { label: "Billing", href: "/billing", icon: "💳", feature: "dashboard:overview" },
    { label: "Brands", href: "/brands", icon: "🏷️", feature: "dashboard:overview" },
    { label: "Events", href: "/events", icon: "🎉", feature: "event-cde" },
    { label: "Budget", href: "/budget", icon: "💵", feature: "dashboard:overview" },
    { label: "Expenses", href: "/expenses", icon: "💰", feature: "dashboard:overview" },
    { label: "Buku Kas", href: "/buku-kas", icon: "📒", feature: "dashboard:overview" },
    { label: "Email", href: "/email", icon: "📧", feature: "dashboard:overview" },
    { label: "BPJS Tracker", href: "/bpjs", icon: "🛡️", feature: "dashboard:overview" },
    { label: "Tax & Compliance", href: "/tax-compliance", icon: "🏛️", feature: "dashboard:overview" },
    { label: "Sales Target", href: "/sales-target", icon: "🎯", feature: "dashboard:overview" },
    { label: "Workflow", href: "/workflow", icon: "🔄", feature: "dashboard:overview" },
    { label: "Sheets", href: "/sheets", icon: "📋", feature: "drive" },
    { label: "Drive", href: "/drive", icon: "📁", feature: "drive" },
    { label: "Automation", href: "/automation", icon: "⚡", feature: "ai-features" },
    { label: "Reports", href: "/reports", icon: "📈", feature: "dashboard" },
    { label: "Sukuk Mikro", href: "/sukuk", icon: "🪙", feature: "dashboard" },
    { label: "AI Chat", href: "/ai-chat", icon: "🤖", feature: "ai-features" },
    { label: "Agent Dashboard", href: "/agent-dashboard", icon: "🦉", feature: "ai-features" },
    { label: "Users", href: "/users", icon: "👥", feature: "user-management" },
    { label: "Tasks", href: "/tasks", icon: "✅", feature: "dashboard:overview" },
    { label: "Settings", href: "/settings", icon: "⚙️", feature: "settings" },
];

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { hasAccess, roleLabel } = usePermissions();

    // Filter nav items based on user permissions
    const visibleItems = NAV_ITEMS.filter((item) => hasAccess(item.feature));

    return (
        <aside
            className={cn(
                "flex flex-col bg-card border-r transition-all duration-200",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo/Brand */}
            <div className="h-16 flex items-center justify-between px-4 border-b">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Image src="/logo-swi.png" alt="Logo SWI" width={32} height={32} />
                        <span className="font-bold text-lg">System SWI</span>
                    </Link>
                )}
                {collapsed && (
                    <Link href="/dashboard">
                        <Image src="/logo-swi.png" alt="Logo SWI" width={32} height={32} />
                    </Link>
                )}
                <button
                    onClick={onToggle}
                    className="p-2 rounded-md hover:bg-accent"
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    {collapsed ? "→" : "←"}
                </button>
            </div>

            {/* Navigation */}
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
                            <span className="text-lg">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer with role */}
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
