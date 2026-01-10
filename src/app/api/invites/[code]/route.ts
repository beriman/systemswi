// GET /api/invites/[code] - Get invite by code (public for acceptance flow)
import { NextRequest, NextResponse } from "next/server";
import { getInviteByCode } from "@/lib/invite";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    if (!code) {
        return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const invite = getInviteByCode(code);

    if (!invite) {
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Return limited info for public access
    return NextResponse.json({
        invite: {
            code: invite.code,
            status: invite.status,
            createdByName: invite.createdByName,
            accessScope: invite.accessScope,
            expiresAt: invite.expiresAt,
            email: invite.email ? `${invite.email.substring(0, 3)}***` : null, // Mask email
        },
    });
}
