"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import BoardModal from "./BoardModal";

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
  role: "super_admin" | "member";
  created_at: string;
}

export default function AdminPanel() {
  const { user, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"boards" | "users">("boards");
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [editingColumn, setEditingColumn] = useState<{ id: string; title: string } | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string; role: "super_admin" | "member" } | null>(null);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"super_admin" | "member">("member");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [createUserError, setCreateUserError] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);

  // Fetch boards with React Query
  const { data: boards = [] } = useQuery({
    queryKey: ['admin-boards'],
    queryFn: async () => {
      const response = await fetch("/api/boards");
      if (!response.ok) throw new Error("Failed to fetch boards");
      return response.json();
    },
    staleTime: 0, // Always fresh for real-time
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Fetch users with React Query
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 0, // Always fresh for real-time
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to boards changes
    const boardsChannel = supabase
      .channel('admin-boards-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'boards'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
      })
      .subscribe();

    // Subscribe to columns changes
    const columnsChannel = supabase
      .channel('admin-columns-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'columns'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
      })
      .subscribe();

    // Subscribe to users changes
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(boardsChannel);
      supabase.removeChannel(columnsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [queryClient]);

  const handleCreateBoard = () => {
    setShowBoardModal(true);
  };

  const handleBoardSubmit = async (name: string) => {
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
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
        queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
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
        queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
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
        queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
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
        queryClient.invalidateQueries({ queryKey: ['admin-boards'] });
      }
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  const handleEditUser = async (userId: string, userData: { name: string; email: string; role: "super_admin" | "member" }) => {
    setSaveError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setEditingUser(null);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        // Refresh current user if they were edited
        if (userId === user?.id) {
          refreshUser();
        }
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || "Failed to save user");
      }
    } catch (error) {
      console.error("Failed to edit user:", error);
      setSaveError("Failed to save user. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isProtectedAdmin = (userItem: User) => {
    return userItem.role === "super_admin";
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user. Please try again.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError("");
    setIsCreatingUser(true);

    try {
      console.log("Creating user with:", { name: newUserName, email: newUserEmail, role: newUserRole });
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const responseData = await response.json();
      console.log("Create user response:", responseData);

      if (response.ok) {
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("member");
        setShowCreateUser(false);
        console.log("User created successfully, fetching users...");
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        console.error("Create user failed:", responseData);
        setCreateUserError(responseData.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      setCreateUserError("Failed to create user. Please try again.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (user?.role !== "super_admin") {
    return null;
  }

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-blue-500/30 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-white">Admin Panel</h2>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base w-full sm:w-auto"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
        <button
          onClick={() => setActiveTab("boards")}
          className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
            activeTab === "boards"
              ? "bg-blue-600 text-white"
              : "bg-black/50 text-blue-300 hover:bg-blue-900/50"
          }`}
        >
          Manage Boards
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
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
          <button
            onClick={handleCreateBoard}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm md:text-base mb-4 md:mb-6"
          >
            + Create Board
          </button>

          <div className="space-y-4">
            {boards.map((board: Board) => (
              <div
                key={board.id}
                className="bg-black/50 border border-blue-500/30 rounded-lg p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={() => setSelectedBoard(selectedBoard?.id === board.id ? null : board)}
                      className="text-blue-300 hover:text-white text-lg"
                    >
                      {selectedBoard?.id === board.id ? "▼" : "▶"}
                    </button>
                    <span className="text-white font-semibold text-sm md:text-base">{board.name}</span>
                    <span className="text-blue-300 text-xs md:text-sm">({board.columns.length} columns)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBoard(board.id)}
                    className="text-red-400 hover:text-red-300 text-sm md:text-base"
                  >
                    Delete Board
                  </button>
                </div>

                {selectedBoard?.id === board.id && (
                  <div className="ml-0 sm:ml-6 space-y-3">
                    <form onSubmit={handleAddColumn} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
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

                    {board.columns.map((column: Column) => (
                      <div
                        key={column.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/30 border border-blue-500/20 rounded-lg px-3 py-2 gap-2"
                      >
                        {editingColumn?.id === column.id ? (
                          <div className="flex items-center space-x-2 flex-1 w-full">
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
                          <span className="text-blue-200 text-sm">{column.title}</span>
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
          <button
            onClick={() => setShowCreateUser(!showCreateUser)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-4 text-sm font-medium transition-colors"
          >
            {showCreateUser ? "Cancel" : "+ Create New User"}
          </button>

          {showCreateUser && (
            <form onSubmit={handleCreateUser} className="bg-black/50 border border-blue-500/30 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="text-blue-300 text-sm block mb-1">Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-sm"
                />
              </div>
              <div>
                <label className="text-blue-300 text-sm block mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-sm"
                />
              </div>
              <div>
                <label className="text-blue-300 text-sm block mb-1">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-sm"
                />
              </div>
              <div>
                <label className="text-blue-300 text-sm block mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "super_admin" | "member")}
                  className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-sm"
                >
                  <option value="member">Member</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {createUserError && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded-lg text-sm">
                  {createUserError}
                </div>
              )}
              <button
                type="submit"
                disabled={isCreatingUser}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                {isCreatingUser ? "Creating..." : "Create User"}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {users.map((userItem: User) => (
              <div
                key={userItem.id}
                className="bg-black/50 border border-blue-500/30 rounded-lg p-3 md:p-4"
              >
                {editingUser?.id === userItem.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Name</label>
                      <input
                        type="text"
                        value={editingUser?.name || ""}
                        onChange={(e) => editingUser && setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Email</label>
                      <input
                        type="email"
                        value={editingUser?.email || ""}
                        onChange={(e) => editingUser && setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-blue-300 text-sm block mb-1">Role</label>
                      <select
                        value={editingUser?.role || "member"}
                        onChange={(e) => editingUser && setEditingUser({ ...editingUser, role: e.target.value as "super_admin" | "member" })}
                        className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 text-sm"
                      >
                        <option value="member">Member</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                    {isProtectedAdmin(userItem) && (
                      <div className="text-yellow-400 text-xs bg-yellow-400/10 rounded-lg px-3 py-2">
                        This is a protected admin user. Admin authority cannot be removed.
                      </div>
                    )}
                    {saveError && (
                      <div className="bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded-lg text-sm">
                        {saveError}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editingUser && handleEditUser(userItem.id, editingUser)}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(null);
                          setSaveError("");
                        }}
                        disabled={isSaving}
                        className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-white font-semibold text-sm md:text-base flex items-center gap-2">
                        {userItem.name}
                        {userItem.role === "super_admin" && (
                          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded">Super Admin</span>
                        )}
                      </div>
                      <div className="text-blue-300 text-xs md:text-sm">{userItem.email}</div>
                      <div className="text-blue-400 text-xs">{userItem.role}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser({ id: userItem.id, name: userItem.name, email: userItem.email, role: userItem.role })}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      {!isProtectedAdmin(userItem) && (
                        <button
                          onClick={() => handleDeleteUser(userItem.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
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

      <BoardModal
        isOpen={showBoardModal}
        onClose={() => setShowBoardModal(false)}
        onSubmit={handleBoardSubmit}
      />
    </div>
  );
}
