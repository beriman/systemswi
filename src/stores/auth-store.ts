// Auth store using Zustand
import { create } from "zustand";
import type { User, AuthState } from "@/lib/auth/types";

const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === "true";

const DEV_USER: User = {
    id: "dev-beriman",
    email: "beriman.juliano@gmail.com",
    name: "Beriman Juliano",
    role: "ceo",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: new Date().toISOString(),
};

interface AuthStore extends AuthState {
    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: ENABLE_AUTH ? null : DEV_USER,
    isLoading: ENABLE_AUTH,
    isAuthenticated: !ENABLE_AUTH,
    error: null,

    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error, isLoading: false }),

    logout: async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            set({ user: null, isAuthenticated: false, error: null });
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
            set({ error: "Logout failed" });
        }
    },

    refreshUser: async () => {
        if (!ENABLE_AUTH) {
            set({ user: DEV_USER, isAuthenticated: true, isLoading: false, error: null });
            return;
        }

        set({ isLoading: true });
        try {
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const { user } = await response.json();
                set({ user, isAuthenticated: !!user, isLoading: false });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            console.error("Failed to refresh user:", error);
            set({ user: null, isAuthenticated: false, isLoading: false, error: "Failed to fetch user" });
        }
    },
}));
