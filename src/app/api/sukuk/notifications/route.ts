// GET /api/sukuk/notifications — List notifications from Sukuk_Notification!A1:H50
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("Sukuk_Notification!A1:H50");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ notifications: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const notifications = dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: r[0] || "",
        timestamp: r[1] || "",
        tipe: r[2] || "",
        judul: r[3] || "",
        pesan: r[4] || "",
        recipient: r[5] || "",
        read_status: r[6] || "unread",
        action_url: r[7] || "",
      }));
    return NextResponse.json({ notifications, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: String(error) },
      { status: 500 }
    );
  }
}
