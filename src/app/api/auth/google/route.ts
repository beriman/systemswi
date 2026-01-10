// GET /api/auth/google - Redirect to Google OAuth
import { NextResponse } from "next/server";
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

    // Redirect to Google consent screen
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
}
