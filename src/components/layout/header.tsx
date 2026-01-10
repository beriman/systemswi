"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";

interface HeaderProps {
    onMenuToggle?: () => void;
    showMenuButton?: boolean;
}

export function Header({ onMenuToggle, showMenuButton = false }: HeaderProps) {
    const { user, logout } = useAuth();
    const { roleLabel } = usePermissions();

    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-4">
            {/* Left side */}
            <div className="flex items-center gap-4">
                {showMenuButton && (
                    <button
                        onClick={onMenuToggle}
                        className="p-2 rounded-md hover:bg-accent lg:hidden"
                        aria-label="Toggle menu"
                    >
                        ☰
                    </button>
                )}
                <h1 className="text-xl font-semibold hidden sm:block">Dashboard</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* User info */}
                <div className="flex items-center gap-3">
                    {user?.picture && (
                        <img
                            src={user.picture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                        />
                    )}
                    <div className="hidden md:block">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{roleLabel}</p>
                    </div>
                </div>

                {/* Logout button */}
                <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                </Button>
            </div>
        </header>
    );
}

export default Header;
