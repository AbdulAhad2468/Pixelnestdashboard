import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BOARDS_FILE = path.join(DATA_DIR, "boards.json");

// GET all boards
export async function GET() {
  try {
    if (!fs.existsSync(BOARDS_FILE)) {
      return NextResponse.json([]);
    }
    const boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    return NextResponse.json(boards);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}

// POST create new board
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Board name is required" }, { status: 400 });
    }

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Read existing boards
    let boards = [];
    if (fs.existsSync(BOARDS_FILE)) {
      boards = JSON.parse(fs.readFileSync(BOARDS_FILE, "utf-8"));
    }

    // Create new board with default columns
    const newBoard = {
      id: Date.now().toString(),
      name,
      columns: [
        { id: "todo", title: "To Do", tasks: [] },
        { id: "in-progress", title: "In Progress", tasks: [] },
        { id: "review", title: "Review", tasks: [] },
        { id: "done", title: "Done", tasks: [] },
      ],
      createdAt: new Date().toISOString(),
    };

    boards.push(newBoard);
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));

    return NextResponse.json(newBoard);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}
