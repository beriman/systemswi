// Auth utilities for Google OAuth

import { SignJWT, jwtVerify } from "jose";
import type { User, Session, GoogleTokenResponse, GoogleUserInfo, UserRole } from "./types";

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Google OAuth URLs
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// Scopes required
const SCOPES = [
    "openid",
    "email",
    "profile",
].join(" ");

/**
 * Generate Google OAuth consent URL with CSRF state
 */
export function getGoogleAuthUrl(state?: string): string {
    // Generate random state for CSRF protection if not provided
    const csrfState = state || Math.random().toString(36).substring(2, 15);

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: `${APP_URL}/api/auth/callback/google`,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: csrfState,
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: `${APP_URL}/api/auth/callback/google`,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
    }

    return response.json();
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        throw new Error("Failed to get user info");
    }

    return response.json();
}

/**
 * Create JWT session token
 */
export async function createSessionToken(user: User): Promise<string> {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new SignJWT({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture, // Include picture in JWT
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    return token;
}

/**
 * Verify and decode JWT session token
 */
export async function verifySessionToken(token: string): Promise<User | null> {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        return {
            id: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string,
            role: payload.role as UserRole,
            picture: payload.picture as string | undefined,
            createdAt: "",
            lastLoginAt: new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

/**
 * Create user from Google user info
 * In production, this would upsert to database
 */
export function createUserFromGoogle(googleUser: GoogleUserInfo): User {
    return {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        role: "panitia", // Default role, will be updated by admin
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
    };
}

/**
 * Check if Google OAuth is configured
 */
export function isOAuthConfigured(): boolean {
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

// Cookie configuration
export const AUTH_COOKIE_NAME = "auth-token";
export const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
};
