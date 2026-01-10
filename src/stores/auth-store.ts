// Auth store using Zustand
import { create } from "zustand";
import type { User, AuthState } from "@/lib/auth/types";

interface AuthStore extends AuthState {
    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
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
