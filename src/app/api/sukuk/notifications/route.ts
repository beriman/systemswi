// GET /api/sukuk/notifications — List notifications
// Tries Google Sheets first, falls back to local data store
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { getLocalNotifications } from "@/lib/sheets/sukuk-local-data";

async function getNotificationsFromSheets() {
  try {
    const rows = await readRange("Sukuk_Notification!A1:H50");
    if (!rows || rows.length === 0) return null;
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    return dataRows
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
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sheetData = await getNotificationsFromSheets();
    if (sheetData && sheetData.length > 0) {
      return NextResponse.json({ notifications: sheetData, source: "sheets" });
    }
    const localData = getLocalNotifications();
    return NextResponse.json({ notifications: localData, source: "local" });
  } catch (error) {
    const localData = getLocalNotifications();
    return NextResponse.json({ notifications: localData, source: "local-fallback" });
  }
}
