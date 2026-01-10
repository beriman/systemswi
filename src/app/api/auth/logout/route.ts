// POST /api/auth/logout - Clear session and redirect to login
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
    const cookieStore = await cookies();

    // Clear auth cookie
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json({ success: true });
}
