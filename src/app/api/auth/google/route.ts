// GET /api/auth/google - Redirect to Google OAuth
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getGoogleAuthUrl, isOAuthConfigured } from "@/lib/auth";

export async function GET() {
    // Check if OAuth is configured
    if (!isOAuthConfigured()) {
        return NextResponse.json(
            {
                error: "Google OAuth not configured",
                message: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file"
            },
            { status: 500 }
        );
    }

    // Redirect to Google consent screen with a CSRF state cookie that is
    // verified by /api/auth/callback/google before creating a session.
    const state = randomBytes(32).toString("hex");
    const authUrl = getGoogleAuthUrl(state);
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth-state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
    });
    return response;
}
