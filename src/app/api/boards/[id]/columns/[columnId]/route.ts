import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");

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

    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Boards file not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const boardIndex = boards.findIndex((b: any) => b.id === params.id);

    if (boardIndex === -1) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const columnIndex = boards[boardIndex].columns.findIndex(
      (c: any) => c.id === params.columnId
    );

    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    boards[boardIndex].columns[columnIndex].title = title;
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));

    return NextResponse.json(boards[boardIndex].columns[columnIndex]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to edit column" }, { status: 500 });
  }
}

// DELETE - Delete column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; columnId: string } }
) {
  try {
    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Boards file not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const boardIndex = boards.findIndex((b: any) => b.id === params.id);

    if (boardIndex === -1) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const columnIndex = boards[boardIndex].columns.findIndex(
      (c: any) => c.id === params.columnId
    );

    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    boards[boardIndex].columns.splice(columnIndex, 1);
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
  }
}
