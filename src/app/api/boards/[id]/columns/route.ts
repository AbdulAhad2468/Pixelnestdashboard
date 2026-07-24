import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Add column to board
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify board exists first
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("id")
      .eq("id", params.id)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const { data: column, error } = await supabase
      .from("columns")
      .insert({ board_id: params.id, title })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message || "Failed to add column" }, { status: 500 });
    }

    return NextResponse.json({
      id: column.id,
      title: column.title,
      tasks: []
    });
  } catch (error) {
    console.error("Failed to add column:", error);
    return NextResponse.json({ error: "Failed to add column" }, { status: 500 });
  }
}
