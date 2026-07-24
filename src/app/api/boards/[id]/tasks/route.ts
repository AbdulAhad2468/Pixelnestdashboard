import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST add task to board
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { columnId, title, description, priority, dueDate } = await request.json();

    if (!columnId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        column_id: columnId,
        title,
        description: description || null,
        priority: priority || "medium",
        due_date: dueDate || null,
      })
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
    console.error("Failed to add task:", error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}

// PUT move task between columns
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { taskId, sourceColumnId, targetColumnId } = await request.json();

    if (!taskId || !sourceColumnId || !targetColumnId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .update({ column_id: targetColumnId })
      .eq("id", taskId)
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
    console.error("Failed to move task:", error);
    return NextResponse.json({ error: "Failed to move task" }, { status: 500 });
  }
}
