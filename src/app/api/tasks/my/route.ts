import { NextRequest, NextResponse } from "next/server";
import { readRange, SHEETS } from "@/lib/sheets/sheets-real";

// GET /api/tasks/my — returns tasks assigned to the requested user
// Query param: assignee (required)

function rowToTask(row: string[]) {
  return {
    id: row[0] || "",
    title: row[1] || "",
    description: row[2] || "",
    assignee: row[3] || "",
    picName: row[4] || "",
    dueDate: row[5] || "",
    priority: row[6] || "",
    status: row[7] || "",
    relatedEvent: row[8] || "",
    createdBy: row[9] || "",
    createdDate: row[10] || "",
    completedDate: row[11] || "",
    notes: row[12] || "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const assignee = url.searchParams.get("assignee") || "";

    if (!assignee) {
      return NextResponse.json(
        { error: "assignee query parameter is required" },
        { status: 400 }
      );
    }

    const range = SHEETS["Tasks"]?.range || "Tasks!A1:M1000";
    const rows = await readRange(range);

    if (rows.length < 2) {
      return NextResponse.json({ tasks: [] });
    }

    const tasks = rows
      .slice(1)
      .map(rowToTask)
      .filter((t) => t.id && t.assignee === assignee);

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch my tasks" },
      { status: 500 }
    );
  }
}
