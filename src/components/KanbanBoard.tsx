"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
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
  const [boards, setBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState("1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch board data
  const fetchBoard = useCallback(async () => {
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
        const defaultBoard = data.find((b: Board) => b.id === currentBoardId) || data[0];
        if (defaultBoard) {
          setBoard(defaultBoard);
          setColumns(defaultBoard.columns);
        }
      }
    } catch (error) {
      console.error("Failed to fetch board:", error);
    }
  }, [currentBoardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const [draggedTask, setDraggedTask] = useState<{ taskId: string; sourceColumnId: string } | null>(null);
  const [touchDraggedTask, setTouchDraggedTask] = useState<{ taskId: string; sourceColumnId: string; element: HTMLElement } | null>(null);

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

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, taskId: string, sourceColumnId: string) => {
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    setTouchDraggedTask({ taskId, sourceColumnId, element });
    element.style.opacity = '0.5';
    element.style.transform = 'scale(1.05)';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDraggedTask) return;
    e.preventDefault();
    const touch = e.touches[0];
    const element = touchDraggedTask.element;
    element.style.position = 'fixed';
    element.style.left = `${touch.clientX - element.offsetWidth / 2}px`;
    element.style.top = `${touch.clientY - element.offsetHeight / 2}px`;
    element.style.zIndex = '1000';
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!touchDraggedTask || !currentBoardId) return;

    const { taskId, sourceColumnId, element } = touchDraggedTask;
    element.style.opacity = '1';
    element.style.transform = 'scale(1)';
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.zIndex = '';

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const columnElement = dropTarget?.closest('[data-column-id]');
    
    if (columnElement) {
      const targetColumnId = columnElement.getAttribute('data-column-id');
      if (targetColumnId && targetColumnId !== sourceColumnId) {
        try {
          const response = await fetch(`/api/boards/${currentBoardId}/tasks`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, sourceColumnId, targetColumnId }),
          });

          if (response.ok) {
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
      }
    }

    setTouchDraggedTask(null);
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
    <div className="flex h-[100dvh] relative overflow-hidden">
      {/* Board Sidebar */}
      <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} md:w-64 md:translate-x-0 bg-black/95 md:bg-black/50 border-r border-blue-500/30 transition-all duration-300 p-5 md:p-4 flex flex-col absolute md:relative z-20 h-full overflow-hidden`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-blue-300 hover:text-white mb-5 self-end md:hidden p-3 -m-3 active:scale-95 transition-transform"
        >
          ✕
        </button>

        <h3 className="text-white font-semibold mb-5 text-lg">Boards</h3>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setCurrentBoardId(b.id);
                setBoard(b);
                setColumns(b.columns);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-5 py-4 rounded-xl transition-colors active:scale-98 ${
                currentBoardId === b.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-blue-300 hover:bg-blue-900/50 active:bg-blue-900/70"
              }`}
            >
              <div className="font-semibold text-base">{b.name}</div>
              <div className="text-sm opacity-70">{b.columns.length} columns</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-30 text-blue-300 hover:text-white p-4 bg-black/70 rounded-2xl text-xl shadow-xl active:scale-95 transition-transform"
      >
        ☰
      </button>

      {/* Kanban Board */}
      <div className="flex-1 p-5 md:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 min-w-0">
        {columns.map((column) => (
          <div
            key={column.id}
            data-column-id={column.id}
            className="bg-black/30 backdrop-blur-lg rounded-xl p-5 md:p-6 min-h-[400px] md:min-h-[500px] border border-blue-500/30 shadow-lg"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                {column.title}
              </h2>
              <div className="flex items-center space-x-2">
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="text-blue-400 hover:text-blue-300 text-2xl p-3 -m-3 active:scale-95 transition-transform"
                  >
                    +
                  </button>
                )}
                <span className="bg-blue-600/50 text-white text-sm md:text-sm px-3 md:px-3 py-1.5 rounded-full">
                  {column.tasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id, column.id)}
                  onTouchStart={(e) => handleTouchStart(e, task.id, column.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="bg-black/50 rounded-xl p-4 md:p-4 shadow-lg hover:shadow-xl transition-shadow cursor-move border-l-4 border-blue-500 touch-none active:scale-98 transition-transform"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white text-base md:text-base leading-tight">
                      {task.title}
                    </h3>
                    <div className="flex items-center space-x-2 md:space-x-2">
                      <span
                        className={`text-xs md:text-xs px-2 py-1 rounded-full text-white ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      {user?.role === "admin" && (
                        <>
                          <button
                            onClick={() => handleUpdateTask(task.id)}
                            className="text-blue-400 hover:text-blue-300 text-xs md:text-xs px-2 py-1 -mx-2 -my-1 active:bg-blue-500/20 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-400 hover:text-red-300 text-xs md:text-xs px-2 py-1 -mx-2 -my-1 active:bg-red-500/20 rounded"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-blue-200 text-sm md:text-sm leading-relaxed">
                    {task.description}
                  </p>
                  {task.dueDate && (
                    <p className="text-blue-300 text-xs md:text-xs mt-3">
                      Due: {task.dueDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
}
