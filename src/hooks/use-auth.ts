// useAuth hook - wrapper around auth store with auto-refresh
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
    const { user, isLoading, isAuthenticated, error, logout, refreshUser, setUser } = useAuthStore();

    // Auto-refresh user on mount
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return {
        user,
        isLoading,
        isAuthenticated,
        error,
        logout,
        refreshUser,
        setUser,
    };
}

export default useAuth;
