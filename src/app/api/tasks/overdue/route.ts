import { NextRequest, NextResponse } from "next/server";
import { readRange, SHEETS } from "@/lib/sheets/sheets-real";

// GET /api/tasks/overdue — returns all tasks where dueDate < today and status != Done

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

export async function GET() {
  try {
    const range = SHEETS["Tasks"]?.range || "Tasks!A1:M1000";
    const rows = await readRange(range);

    if (rows.length < 2) {
      return NextResponse.json({ tasks: [] });
    }

    const today = new Date().toISOString().split("T")[0];

    const overdue = rows
      .slice(1)
      .map(rowToTask)
      .filter((t) => t.id && t.dueDate && t.dueDate < today && t.status !== "Done");

    return NextResponse.json({ tasks: overdue, count: overdue.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch overdue tasks" },
      { status: 500 }
    );
  }
}
