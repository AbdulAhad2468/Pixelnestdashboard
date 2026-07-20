"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Chat from "./Chat";
import PrivateChat from "./PrivateChat";
import AdminPanel from "./AdminPanel";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

export default function KanbanBoard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState("1");

  // Fetch board data
  const fetchBoard = async () => {
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const boards = await response.json();
        const defaultBoard = boards.find((b: Board) => b.id === currentBoardId) || boards[0];
        if (defaultBoard) {
          setBoard(defaultBoard);
          setColumns(defaultBoard.columns);
          setCurrentBoardId(defaultBoard.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch board:", error);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [currentBoardId]);

  const [draggedTask, setDraggedTask] = useState<{ taskId: string; sourceColumnId: string } | null>(null);

  const handleDragStart = (taskId: string, sourceColumnId: string) => {
    setDraggedTask({ taskId, sourceColumnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetColumnId: string) => {
    if (!draggedTask || !currentBoardId) return;

    const { taskId, sourceColumnId } = draggedTask;

    if (sourceColumnId === targetColumnId) return;

    try {
      const response = await fetch(`/api/boards/${currentBoardId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, sourceColumnId, targetColumnId }),
      });

      if (response.ok) {
        // Update local state
        setColumns((prevColumns) => {
          const sourceColumn = prevColumns.find((col) => col.id === sourceColumnId);
          const targetColumn = prevColumns.find((col) => col.id === targetColumnId);

          if (!sourceColumn || !targetColumn) return prevColumns;

          const taskToMove = sourceColumn.tasks.find((task) => task.id === taskId);
          if (!taskToMove) return prevColumns;

          return prevColumns.map((column) => {
            if (column.id === sourceColumnId) {
              return {
                ...column,
                tasks: column.tasks.filter((task) => task.id !== taskId),
              };
            }
            if (column.id === targetColumnId) {
              return {
                ...column,
                tasks: [...column.tasks, taskToMove],
              };
            }
            return column;
          });
        });
      }
    } catch (error) {
      console.error("Failed to move task:", error);
    }

    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleAddTask = async (columnId: string) => {
    if (user?.role !== "admin") return;

    const title = prompt("Enter task title:");
    if (!title) return;

    const description = prompt("Enter task description:") || "";
    const priorityInput = prompt("Enter priority (low/medium/high):") || "medium";
    const priority = ["low", "medium", "high"].includes(priorityInput) 
      ? priorityInput as "low" | "medium" | "high" 
      : "medium";
    const dueDate = prompt("Enter due date (YYYY-MM-DD, optional):") || "";

    try {
      const response = await fetch(`/api/boards/${currentBoardId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, title, description, priority, dueDate }),
      });

      if (response.ok) {
        fetchBoard(); // Refresh board data
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    const title = prompt("Enter new task title:");
    if (!title) return;

    const description = prompt("Enter new task description:") || "";
    const priorityInput = prompt("Enter new priority (low/medium/high):") || "";
    const priority = ["low", "medium", "high"].includes(priorityInput) 
      ? priorityInput as "low" | "medium" | "high" 
      : undefined;

    try {
      const response = await fetch(`/api/boards/${currentBoardId}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });

      if (response.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/boards/${currentBoardId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-black/30 backdrop-blur-lg rounded-xl p-4 md:p-6 min-h-[500px] border border-blue-500/30"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                {column.title}
              </h2>
              <div className="flex items-center space-x-2">
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="text-blue-400 hover:text-blue-300 text-xl"
                  >
                    +
                  </button>
                )}
                <span className="bg-blue-600/50 text-white text-sm px-3 py-1 rounded-full">
                  {column.tasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id, column.id)}
                  className="bg-black/50 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow cursor-move border-l-4 border-blue-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-sm md:text-base">
                      {task.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full text-white ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      <button
                        onClick={() => handleUpdateTask(task.id)}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Edit
                      </button>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-blue-200 text-xs md:text-sm">
                    {task.description}
                  </p>
                  {(task as any).dueDate && (
                    <p className="text-blue-300 text-xs mt-2">
                      Due: {(task as any).dueDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
