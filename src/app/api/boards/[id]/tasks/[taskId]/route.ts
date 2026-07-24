import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PUT update task
export async function PUT(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { title, description, priority } = await request.json();

    const updates: any = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority) updates.priority = priority;

    const { data: task, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", params.taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: task.id,
      columnId: task.column_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.due_date,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE task
export async function DELETE(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", params.taskId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
