import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");

// DELETE board
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const filteredBoards = boards.filter((board: any) => board.id !== id);

    if (boards.length === filteredBoards.length) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    fs.writeFileSync(BOARDS_FILE, JSON.stringify(filteredBoards, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
