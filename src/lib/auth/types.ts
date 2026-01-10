// Auth types

export type UserRole = "ceo" | "coo" | "komisaris" | "panitia" | "freelancer";

export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    role: UserRole;
    createdAt: string;
    lastLoginAt: string;
}

export interface Session {
    user: User;
    accessToken: string;
    expiresAt: number;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token: string;
}

export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}
