// GET /api/auth/me - Get current user from session
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await verifySessionToken(token);

    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
}
