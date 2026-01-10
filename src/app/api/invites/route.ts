// POST /api/invites - Create invite (CEO/COO only)
// GET /api/invites - List invites
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { createInvite, getInvitesByCreator, type CreateInviteInput } from "@/lib/invite";

export async function POST(request: NextRequest) {
    // Verify auth
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Only CEO/COO can create invites
    if (user.role !== "ceo" && user.role !== "coo") {
        return NextResponse.json({ error: "Only CEO/COO can create invites" }, { status: 403 });
    }

    try {
        const body: CreateInviteInput = await request.json();

        // Validate input
        if (!body.accessScope || body.accessScope.length === 0) {
            return NextResponse.json({ error: "Access scope is required" }, { status: 400 });
        }

        const invite = createInvite(body, user.id, user.name);

        return NextResponse.json({ invite });
    } catch (error) {
        console.error("Create invite error:", error);
        return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }
}

export async function GET() {
    // Verify auth
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Only CEO/COO can view invites
    if (user.role !== "ceo" && user.role !== "coo") {
        return NextResponse.json({ error: "Only CEO/COO can view invites" }, { status: 403 });
    }

    const invites = getInvitesByCreator(user.id);
    return NextResponse.json({ invites });
}
