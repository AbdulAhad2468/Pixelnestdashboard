import { NextRequest, NextResponse } from "next/server";
import { getBoards, createBoard, getColumns, createColumn, getTasks } from "@/lib/db";

// GET all boards
export async function GET() {
  try {
    const boards = await getBoards();
    
    // Fetch columns and tasks for each board
    const boardsWithColumns = await Promise.all(
      boards.map(async (board: any) => {
        const columns = await getColumns(board.id);
        const columnsWithTasks = await Promise.all(
          columns.map(async (col: any) => {
            const tasks = await getTasks(col.id);
            return {
              id: col.id,
              title: col.title,
              tasks: tasks.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                dueDate: task.due_date
              }))
            };
          })
        );
        return {
          ...board,
          columns: columnsWithTasks
        };
      })
    );
    
    return NextResponse.json(boardsWithColumns);
  } catch (error) {
    console.error("Failed to fetch boards:", error);
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

    // Create new board
    const newBoard = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    };

    const createdBoard = await createBoard(newBoard);

    // Create default columns
    const defaultColumns = [
      { id: `${createdBoard.id}_todo`, boardId: createdBoard.id, title: "To Do" },
      { id: `${createdBoard.id}_in-progress`, boardId: createdBoard.id, title: "In Progress" },
      { id: `${createdBoard.id}_review`, boardId: createdBoard.id, title: "Review" },
      { id: `${createdBoard.id}_done`, boardId: createdBoard.id, title: "Done" },
    ];

    await Promise.all(defaultColumns.map(createColumn));

    return NextResponse.json({
      ...createdBoard,
      columns: defaultColumns.map(col => ({
        id: col.id,
        title: col.title,
        tasks: []
      }))
    });
  } catch (error) {
    console.error("Failed to create board:", error);
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}
