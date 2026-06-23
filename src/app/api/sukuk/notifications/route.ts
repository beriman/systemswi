// GET /api/sukuk/notifications — Notification list
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

// SukukNotification: Sukuk_Notification!A1:H50
const NOTIF_RANGE = "Sukuk_Notification!A1:H50";

export async function GET() {
  try {
    const rows = await readRange(NOTIF_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ notifications: [], source: "sheets" });
    }
    const notifications = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      notifications.push({
        id: r[0] || String(i),
        timestamp: r[1] || "",
        tipe: r[2] || "",
        judul: r[3] || "",
        pesan: r[4] || "",
        recipient: r[5] || "",
        read_status: r[6] || "unread",
        action_url: r[7] || "",
      });
    }
    return NextResponse.json({ notifications, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ notifications: [], source: "error", error: String(error) });
  }
}
