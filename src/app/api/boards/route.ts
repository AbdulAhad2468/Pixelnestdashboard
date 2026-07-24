import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all boards
export async function GET() {
  try {
    const { data: boards, error: boardsError } = await supabase
      .from("boards")
      .select("*")
      .order("created_at", { ascending: false });

    if (boardsError) {
      console.error("Supabase boards error:", boardsError);
      return NextResponse.json({ error: boardsError.message || "Failed to fetch boards" }, { status: 500 });
    }

    // If no boards exist, return empty array
    if (!boards || boards.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch columns and tasks for each board
    const boardsWithColumns = await Promise.all(
      boards.map(async (board: any) => {
        const { data: columns, error: columnsError } = await supabase
          .from("columns")
          .select("*")
          .eq("board_id", board.id)
          .order("created_at", { ascending: true });

        if (columnsError) {
          console.error("Supabase columns error for board", board.id, ":", columnsError);
          // Return board without columns if fetch fails
          return {
            id: board.id,
            name: board.name,
            createdAt: board.created_at,
            columns: []
          };
        }

        const columnsWithTasks = await Promise.all(
          columns.map(async (col: any) => {
            const { data: tasks, error: tasksError } = await supabase
              .from("tasks")
              .select("*")
              .eq("column_id", col.id)
              .order("created_at", { ascending: true });

            if (tasksError) {
              console.error("Supabase tasks error for column", col.id, ":", tasksError);
              // Return column without tasks if fetch fails
              return {
                id: col.id,
                title: col.title,
                tasks: []
              };
            }

            return {
              id: col.id,
              title: col.title,
              tasks: tasks.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                dueDate: task.due_date,
                createdAt: task.created_at,
                updatedAt: task.updated_at
              }))
            };
          })
        );

        return {
          id: board.id,
          name: board.name,
          createdAt: board.created_at,
          columns: columnsWithTasks
        };
      })
    );

    return NextResponse.json(boardsWithColumns);
  } catch (error: any) {
    console.error("Failed to fetch boards:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch boards" }, { status: 500 });
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
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .insert({ name })
      .select()
      .single();

    if (boardError) throw boardError;

    // Create default columns
    const defaultColumns = [
      { board_id: board.id, title: "To Do" },
      { board_id: board.id, title: "In Progress" },
      { board_id: board.id, title: "Review" },
      { board_id: board.id, title: "Done" },
    ];

    const { data: columns, error: columnsError } = await supabase
      .from("columns")
      .insert(defaultColumns)
      .select();

    if (columnsError) throw columnsError;

    return NextResponse.json({
      id: board.id,
      name: board.name,
      createdAt: board.created_at,
      columns: columns.map(col => ({
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
