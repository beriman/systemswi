import { NextRequest, NextResponse } from "next/server";
import { readRange, writeRange, SHEETS } from "@/lib/sheets/sheets-real";

// Tasks sheet columns (13 cols, A:M):
// 0: Task ID, 1: Title, 2: Description, 3: Assignee, 4: PIC Name,
// 5: Due Date, 6: Priority, 7: Status, 8: Related Event/Project,
// 9: Created By, 10: Created Date, 11: Completed Date, 12: Notes

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

async function findTaskRowIndex(taskId: string): Promise<number> {
  const range = SHEETS["Tasks"]?.range || "Tasks!A1:M1000";
  const rows = await readRange(range);
  // rows[0] is header, data starts at row 2 (index 1 in array = row 2 in sheet)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === taskId) {
      return i + 1; // 1-based row number in sheet
    }
  }
  return -1;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rowIndex = await findTaskRowIndex(id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const range = SHEETS["Tasks"]?.range || "Tasks!A1:M1000";
    const match = range.match(/^(?:([^!]+)!)?([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    const colStart = match ? match[2] : "A";
    const colEnd = match ? match[4] : "M";
    const sheetName = match?.[1] || "Tasks";

    const rowData = await readRange(`${sheetName}!${colStart}${rowIndex}:${colEnd}${rowIndex}`);
    const task = rowToTask(rowData[0] || []);

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rowIndex = await findTaskRowIndex(id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const range = SHEETS["Tasks"]?.range || "Tasks!A1:M1000";
    const match = range.match(/^(?:([^!]+)!)?([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    const colStart = match ? match[2] : "A";
    const colEnd = match ? match[4] : "M";
    const sheetName = match?.[1] || "Tasks";

    // Read current row
    const rowData = await readRange(`${sheetName}!${colStart}${rowIndex}:${colEnd}${rowIndex}`);
    const current = rowData[0] || [];

    // Update only provided fields
    const updated = [...current];
    if (body.title !== undefined) updated[1] = body.title;
    if (body.description !== undefined) updated[2] = body.description;
    if (body.assignee !== undefined) updated[3] = body.assignee;
    if (body.picName !== undefined) updated[4] = body.picName;
    if (body.dueDate !== undefined) updated[5] = body.dueDate;
    if (body.priority !== undefined) updated[6] = body.priority;
    if (body.status !== undefined) {
      updated[7] = body.status;
      // Auto-set completed date when status changes to Done
      if (body.status === "Done") {
        updated[11] = new Date().toISOString().split("T")[0];
      } else {
        updated[11] = "";
      }
    }
    if (body.relatedEvent !== undefined) updated[8] = body.relatedEvent;
    if (body.notes !== undefined) updated[12] = body.notes;

    await writeRange(`${sheetName}!${colStart}${rowIndex}:${colEnd}${rowIndex}`, [updated]);

    return NextResponse.json({ task: rowToTask(updated), success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}
