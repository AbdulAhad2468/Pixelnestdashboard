import { NextRequest, NextResponse } from "next/server";
import { updateTask, deleteTask } from "@/lib/db";

// PUT update task
export async function PUT(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { id, taskId } = params;
    const { title, description, priority } = await request.json();

    const updates: any = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority) updates.priority = priority;
    updates.updated_at = new Date().toISOString();

    const updatedTask = await updateTask(taskId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE task
export async function DELETE(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { id, taskId } = params;

    await deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
