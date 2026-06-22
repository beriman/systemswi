import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows, SHEETS } from "@/lib/sheets/sheets-real";

// Task_Comments columns (5 cols, A:E):
// 0: Comment ID, 1: Task ID, 2: Author, 3: Date, 4: Comment

const COMMENT_HEADERS = ["Comment ID", "Task ID", "Author", "Date", "Comment"];

async function ensureCommentHeaders() {
  try {
    const existing = await readRange("Task_Comments!A1:E1");
    if (!existing || existing.length === 0 || !existing[0]?.[0]) {
      await appendRows("Task_Comments", [COMMENT_HEADERS]);
    }
  } catch {
    // ignore
  }
}

async function findTaskExists(taskId: string): Promise<boolean> {
  const range = SHEETS["Tasks"]?.range || "Tasks!A1:M1000";
  const rows = await readRange(range);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === taskId) return true;
  }
  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await req.json();
    const { author, comment } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }
    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    // Verify task exists
    const taskExists = await findTaskExists(taskId);
    if (!taskExists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await ensureCommentHeaders();

    const commentId = `CMT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString().split("T")[0];

    const newComment = [
      commentId,
      taskId,
      author || "Anonymous",
      now,
      comment,
    ];

    await appendRows("Task_Comments", [newComment]);

    return NextResponse.json(
      {
        comment: {
          id: commentId,
          taskId,
          author: author || "Anonymous",
          date: now,
          comment,
        },
        success: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add comment" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const range = SHEETS["Task_Comments"]?.range || "Task_Comments!A1:E1000";
    const rows = await readRange(range);

    if (rows.length < 2) {
      return NextResponse.json({ comments: [] });
    }

    const comments = rows
      .slice(1)
      .filter((row) => row[1] === taskId)
      .map((row) => ({
        id: row[0] || "",
        taskId: row[1] || "",
        author: row[2] || "",
        date: row[3] || "",
        comment: row[4] || "",
      }));

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
