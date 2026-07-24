import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE board
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete board:", error);
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
