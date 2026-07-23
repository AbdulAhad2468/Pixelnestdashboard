import { NextRequest, NextResponse } from "next/server";
import { createTask, moveTask } from "@/lib/db";

// POST add task to board
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { columnId, title, description, priority, dueDate } = await request.json();

    if (!columnId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newTask = {
      id: Date.now().toString(),
      columnId,
      title,
      description: description || "",
      priority: priority || "medium",
      dueDate: dueDate || null,
    };

    const createdTask = await createTask(newTask);
    return NextResponse.json(createdTask);
  } catch (error) {
    console.error("Failed to add task:", error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}

// PUT move task between columns
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { taskId, sourceColumnId, targetColumnId } = await request.json();

    if (!taskId || !sourceColumnId || !targetColumnId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const movedTask = await moveTask(taskId, targetColumnId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to move task:", error);
    return NextResponse.json({ error: "Failed to move task" }, { status: 500 });
  }
}
