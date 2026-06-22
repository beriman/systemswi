import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows, SHEETS } from "@/lib/sheets/sheets-real";

// Tasks sheet columns (13 cols, A:M):
// 0: Task ID, 1: Title, 2: Description, 3: Assignee, 4: PIC Name,
// 5: Due Date, 6: Priority, 7: Status, 8: Related Event/Project,
// 9: Created By, 10: Created Date, 11: Completed Date, 12: Notes

const HEADERS = [
  "Task ID", "Title", "Description", "Assignee", "PIC Name",
  "Due Date", "Priority", "Status", "Related Event/Project",
  "Created By", "Created Date", "Completed Date", "Notes",
];

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

function taskToRow(task: Record<string, string>): string[] {
  return [
    task.id || "",
    task.title || "",
    task.description || "",
    task.assignee || "",
    task.picName || "",
    task.dueDate || "",
    task.priority || "",
    task.status || "",
    task.relatedEvent || "",
    task.createdBy || "",
    task.createdDate || "",
    task.completedDate || "",
    task.notes || "",
  ];
}

async function ensureHeaders() {
  try {
    const existing = await readRange("Tasks!A1:M1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await appendRows("Tasks", [HEADERS]);
    }
  } catch {
    // ignore
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "";
    const assignee = url.searchParams.get("assignee") || "";
    const priority = url.searchParams.get("priority") || "";

    const range = SHEETS["Tasks"]?.range || "Tasks!A1:M1000";
    const rows = await readRange(range);

    if (rows.length < 2) {
      return NextResponse.json({ tasks: [] });
    }

    let tasks = rows.slice(1).map(rowToTask).filter((t) => t.id);

    if (status) tasks = tasks.filter((t) => t.status === status);
    if (assignee) tasks = tasks.filter((t) => t.assignee === assignee);
    if (priority) tasks = tasks.filter((t) => t.priority === priority);

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      assignee,
      picName,
      dueDate,
      priority,
      status,
      relatedEvent,
      createdBy,
      notes,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await ensureHeaders();

    const id = `TSK-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString().split("T")[0];

    const newTask: Record<string, string> = {
      id,
      title,
      description: description || "",
      assignee: assignee || "",
      picName: picName || assignee || "",
      dueDate: dueDate || "",
      priority: priority || "Medium",
      status: status || "To Do",
      relatedEvent: relatedEvent || "",
      createdBy: createdBy || "System",
      createdDate: now,
      completedDate: "",
      notes: notes || "",
    };

    await appendRows("Tasks", [taskToRow(newTask)]);

    return NextResponse.json({ task: newTask, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
