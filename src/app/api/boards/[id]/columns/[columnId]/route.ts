import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PUT - Edit column
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; columnId: string } }
) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: column, error } = await supabase
      .from("columns")
      .update({ title })
      .eq("id", params.columnId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: column.id,
      title: column.title,
      tasks: []
    });
  } catch (error) {
    console.error("Failed to edit column:", error);
    return NextResponse.json({ error: "Failed to edit column" }, { status: 500 });
  }
}

// DELETE - Delete column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; columnId: string } }
) {
  try {
    const { error } = await supabase
      .from("columns")
      .delete()
      .eq("id", params.columnId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete column:", error);
    return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
  }
}
