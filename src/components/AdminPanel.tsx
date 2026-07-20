"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

interface Column {
  id: string;
  title: string;
  tasks: any[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newBoardName, setNewBoardName] = useState("");
  const [activeTab, setActiveTab] = useState<"boards" | "users">("boards");
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [editingColumn, setEditingColumn] = useState<{ id: string; title: string } | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  // Fetch boards
  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error("Failed to fetch boards:", error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName }),
      });

      if (response.ok) {
        setNewBoardName("");
        fetchBoards();
      }
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  };

  const handleDeleteBoard = async (id: string) => {
    try {
      const response = await fetch(`/api/boards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBoards();
        if (selectedBoard?.id === id) {
          setSelectedBoard(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoard || !newColumnName.trim()) return;

    try {
      const response = await fetch(`/api/boards/${selectedBoard.id}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newColumnName }),
      });

      if (response.ok) {
        setNewColumnName("");
        fetchBoards();
      }
    } catch (error) {
      console.error("Failed to add column:", error);
    }
  };

  const handleEditColumn = async (columnId: string, newTitle: string) => {
    if (!selectedBoard || !newTitle.trim()) return;

    try {
      const response = await fetch(`/api/boards/${selectedBoard.id}/columns/${columnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setEditingColumn(null);
        fetchBoards();
      }
    } catch (error) {
      console.error("Failed to edit column:", error);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!selectedBoard) return;

    try {
      const response = await fetch(`/api/boards/${selectedBoard.id}/columns/${columnId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBoards();
      }
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  const handleEditUser = async (userId: string, userData: { name: string; email: string; role: string }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to edit user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-blue-500/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("boards")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "boards"
              ? "bg-blue-600 text-white"
              : "bg-black/50 text-blue-300 hover:bg-blue-900/50"
          }`}
        >
          Manage Boards
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "users"
              ? "bg-blue-600 text-white"
              : "bg-black/50 text-blue-300 hover:bg-blue-900/50"
          }`}
        >
          Manage Users
        </button>
      </div>

      {activeTab === "boards" && (
        <div>
          <form onSubmit={handleCreateBoard} className="flex space-x-2 mb-6">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="New board name"
              className="flex-1 bg-black/50 border border-blue-500/50 rounded-lg px-4 py-2 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Board
            </button>
          </form>

          <div className="space-y-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="bg-black/50 border border-blue-500/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedBoard(selectedBoard?.id === board.id ? null : board)}
                      className="text-blue-300 hover:text-white"
                    >
                      {selectedBoard?.id === board.id ? "▼" : "▶"}
                    </button>
                    <span className="text-white font-semibold">{board.name}</span>
                    <span className="text-blue-300 text-sm">({board.columns.length} columns)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBoard(board.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete Board
                  </button>
                </div>

                {selectedBoard?.id === board.id && (
                  <div className="ml-6 space-y-3">
                    <form onSubmit={handleAddColumn} className="flex space-x-2">
                      <input
                        type="text"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="New column name"
                        className="flex-1 bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                      >
                        Add Column
                      </button>
                    </form>

                    {board.columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex items-center justify-between bg-black/30 border border-blue-500/20 rounded-lg px-3 py-2"
                      >
                        {editingColumn?.id === column.id ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              defaultValue={column.title}
                              onBlur={(e) => handleEditColumn(column.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleEditColumn(column.id, (e.target as HTMLInputElement).value);
                                }
                              }}
                              className="flex-1 bg-black/50 border border-blue-500/50 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-400"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="text-blue-200">{column.title}</span>
                        )}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingColumn({ id: column.id, title: column.title })}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div>
          <div className="space-y-3">
            {users.map((userItem) => (
              <div
                key={userItem.id}
                className="bg-black/50 border border-blue-500/30 rounded-lg p-4"
              >
                {editingUser?.id === userItem.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Name</label>
                      <input
                        type="text"
                        defaultValue={userItem.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={userItem.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Role</label>
                      <select
                        defaultValue={userItem.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(userItem.id, editingUser)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{userItem.name}</div>
                      <div className="text-blue-300 text-sm">{userItem.email}</div>
                      <div className="text-blue-400 text-xs">{userItem.role}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser({ id: userItem.id, name: userItem.name, email: userItem.email, role: userItem.role })}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      {userItem.id !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
