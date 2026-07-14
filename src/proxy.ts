// Next.js Proxy for Route Protection (Next.js 16+)
// Migrated from middleware.ts to proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Auth may be disabled explicitly for local development with ENABLE_PORTAL_AUTH=false.
// In production, default to locked down so a missing env var does not expose APIs.
const ENABLE_PORTAL_AUTH = process.env.ENABLE_PORTAL_AUTH !== "false" && (
    process.env.NODE_ENV === "production" || process.env.ENABLE_PORTAL_AUTH === "true"
);

// Paths that require authentication when ENABLE_PORTAL_AUTH=true.
const PROTECTED_PATHS = [
    "/dashboard",
    "/workspace",
];

// API routes are protected by default when portal auth is enabled. Keep only
// authentication callbacks and webhook receivers with their own signature/secret
// verification public.
const PUBLIC_API_PATHS = [
    "/api/auth",
    "/api/agent/telegram-webhook",
    "/api/invites",
];

// Cookie name (must match auth/index.ts)
const AUTH_COOKIE_NAME = "auth-token";

// JWT secret. Production must provide JWT_SECRET; the fallback is dev-only.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret-change-in-production" : "");

/**
 * Check if path is an API endpoint intentionally left public.
 */
function isPublicApiPath(pathname: string): boolean {
    return PUBLIC_API_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

/**
 * Check if path is protected
 */
function isProtectedPath(pathname: string): boolean {
    if (pathname.startsWith("/api/")) {
        return !isPublicApiPath(pathname);
    }

    return PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<boolean> {
    try {
        if (!JWT_SECRET) {
            return false;
        }

        const secret = new TextEncoder().encode(JWT_SECRET);
        await jwtVerify(token, secret);
        return true;
    } catch {
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Development mode: keep dashboard/workspace directly accessible.
    if (!ENABLE_PORTAL_AUTH) {
        return NextResponse.next();
    }

    // Skip proxy for static files and explicitly public API endpoints.
    if (
        pathname.startsWith("/_next") ||
        isPublicApiPath(pathname) ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Get auth token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const isAuthenticated = token ? await verifyToken(token) : false;

    // If accessing protected API without auth, return JSON 401 instead of a page redirect.
    if (pathname.startsWith("/api/") && isProtectedPath(pathname) && !isAuthenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If accessing protected page route without auth, redirect to login
    if (isProtectedPath(pathname) && !isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If authenticated and trying to access login, redirect to dashboard
    if (pathname === "/login" && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
