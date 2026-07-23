import { NextRequest, NextResponse } from "next/server";
import { deleteBoard, getBoardById } from "@/lib/db";

// DELETE board
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const board = await getBoardById(id);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    await deleteBoard(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
