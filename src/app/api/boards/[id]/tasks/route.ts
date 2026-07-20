import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");

// POST add task to board
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { columnId, title, description, priority } = await request.json();

    if (!columnId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const board = boards.find((b: any) => b.id === id);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const column = board.columns.find((col: any) => col.id === columnId);
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      description: description || "",
      priority: priority || "medium",
    };

    column.tasks.push(newTask);
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));

    return NextResponse.json(newTask);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}

// PUT move task between columns
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { taskId, sourceColumnId, targetColumnId } = await request.json();

    if (!taskId || !sourceColumnId || !targetColumnId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const board = boards.find((b: any) => b.id === id);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const sourceColumn = board.columns.find((col: any) => col.id === sourceColumnId);
    const targetColumn = board.columns.find((col: any) => col.id === targetColumnId);

    if (!sourceColumn || !targetColumn) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const taskIndex = sourceColumn.tasks.findIndex((t: any) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const [task] = sourceColumn.tasks.splice(taskIndex, 1);
    targetColumn.tasks.push(task);

    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to move task" }, { status: 500 });
  }
}
