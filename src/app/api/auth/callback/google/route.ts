// GET /api/auth/callback/google - Handle OAuth callback
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    exchangeCodeForTokens,
    getGoogleUserInfo,
    createUserFromGoogle,
    createSessionToken,
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_OPTIONS,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    // Validate code exists
    if (!code) {
        return NextResponse.redirect(
            new URL("/login?error=no_code", request.url)
        );
    }

    try {
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);

        // Get user info from Google
        const googleUser = await getGoogleUserInfo(tokens.access_token);

        // Create/update user in system
        const user = createUserFromGoogle(googleUser);

        // Create JWT session token
        const sessionToken = await createSessionToken(user);

        // Set auth cookie
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, sessionToken, AUTH_COOKIE_OPTIONS);

        // Redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (err) {
        console.error("OAuth callback error:", err);
        return NextResponse.redirect(
            new URL("/login?error=auth_failed", request.url)
        );
    }
}
