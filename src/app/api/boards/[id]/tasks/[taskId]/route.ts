import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");

// PUT update task
export async function PUT(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { id, taskId } = params;
    const { title, description, priority } = await request.json();

    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const board = boards.find((b: any) => b.id === id);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Find and update task
    let taskFound = false;
    for (const column of board.columns) {
      const task = column.tasks.find((t: any) => t.id === taskId);
      if (task) {
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority) task.priority = priority;
        task.updatedAt = new Date().toISOString();
        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE task
export async function DELETE(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { id, taskId } = params;

    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    const board = boards.find((b: any) => b.id === id);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Find and remove task
    let taskFound = false;
    for (const column of board.columns) {
      const taskIndex = column.tasks.findIndex((t: any) => t.id === taskId);
      if (taskIndex !== -1) {
        column.tasks.splice(taskIndex, 1);
        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
