import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");

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

    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Boards file not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const boardIndex = boards.findIndex((b: any) => b.id === params.id);

    if (boardIndex === -1) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const newColumn = {
      id: Date.now().toString(),
      title,
      tasks: [],
    };

    boards[boardIndex].columns.push(newColumn);
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));

    return NextResponse.json(newColumn);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add column" }, { status: 500 });
  }
}
