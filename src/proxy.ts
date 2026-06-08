// Next.js Proxy for Route Protection (Next.js 16+)
// Migrated from middleware.ts to proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Auth is disabled by default while System SWI is still in active development.
// Set ENABLE_PORTAL_AUTH=true in production when the portal is ready to be locked down.
const ENABLE_PORTAL_AUTH = process.env.ENABLE_PORTAL_AUTH === "true";

// Paths that require authentication when ENABLE_PORTAL_AUTH=true.
const PROTECTED_PATHS = [
    "/dashboard",
    "/workspace",
];

// Paths that are always public
const PUBLIC_PATHS = [
    "/",
    "/login",
    "/api/auth/google",
    "/api/auth/callback",
];

// Cookie name (must match auth/index.ts)
const AUTH_COOKIE_NAME = "auth-token";

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

/**
 * Check if path is protected
 */
function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

/**
 * Check if path is public
 */
function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<boolean> {
    try {
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

    // Skip middleware for static files and API routes (except protected ones)
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Get auth token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const isAuthenticated = token ? await verifyToken(token) : false;

    // If accessing protected route without auth, redirect to login
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
