"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
  attachment?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "member";
  online?: boolean;
}

export default function PrivateChat() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [allMessages, setAllMessages] = useState<PrivateMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usersRef = useRef<User[]>([]);

  // Fetch users and all messages
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError(null);
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          // Filter out current user and ensure users have valid profiles
          const validUsers = data.filter((u: User) => u.id !== user?.id && u.name && u.email);
          // Simulate online status (in real app, this would come from WebSocket)
          const usersWithStatus = validUsers.map((u: User) => ({
            ...u,
            online: Math.random() > 0.3 // 70% chance of being online
          }));
          setUsers(usersWithStatus);
          usersRef.current = usersWithStatus;
          setOnlineUsers(new Set(usersWithStatus.filter((u: User) => u.online).map((u: User) => u.id)));
        } else {
          setError("Failed to load users");
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    const fetchAllMessages = async () => {
      if (!user) return;
      try {
        const response = await fetch(`/api/messages?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setAllMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchUsers();
    fetchAllMessages();

    // Subscribe to private messages for real-time updates
    const channel = supabase
      .channel('private-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_messages'
      }, () => {
        fetchAllMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (!user || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const conversationMessages = data.filter(
            (msg: PrivateMessage) =>
              (msg.senderId === user.id && msg.receiverId === selectedUser.id) ||
              (msg.senderId === selectedUser.id && msg.receiverId === user.id)
          );
          setMessages(conversationMessages);

          // Mark unread messages from the selected user as read
          const unreadMessages = conversationMessages.filter(
            (msg: PrivateMessage) => msg.senderId === selectedUser.id && !msg.read
          );
          unreadMessages.forEach(async (msg: PrivateMessage) => {
            try {
              await fetch(`/api/messages/${msg.id}/read`, {
                method: "PUT",
              });
            } catch (error) {
              console.error("Failed to mark message as read:", error);
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user, selectedUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;
    if (!user?.id) {
      setError("You must be logged in to send messages");
      return;
    }
    if (!selectedUser?.id) {
      setError("No user selected");
      return;
    }

    setSending(true);
    setError(null);

    try {
      let attachment = null;
      if (selectedFile) {
        const reader = new FileReader();
        attachment = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedUser.id,
          text: message,
          attachment,
        }),
      });

      if (response.ok) {
        setMessage("");
        setSelectedFile(null);
        // Refresh messages
        const messagesResponse = await fetch(`/api/messages?userId=${user.id}`);
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          setAllMessages(data);
          const conversationMessages = data.filter(
            (msg: PrivateMessage) =>
              (msg.senderId === user.id && msg.receiverId === selectedUser.id) ||
              (msg.senderId === selectedUser.id && msg.receiverId === user.id)
          );
          setMessages(conversationMessages);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    if (!user || !selectedUser) return;

    try {
      const response = await fetch("/api/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        // Refresh messages
        const messagesResponse = await fetch(`/api/messages?userId=${user.id}`);
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          setAllMessages(data);
          const conversationMessages = data.filter(
            (msg: PrivateMessage) =>
              (msg.senderId === user.id && msg.receiverId === selectedUser.id) ||
              (msg.senderId === selectedUser.id && msg.receiverId === user.id)
          );
          setMessages(conversationMessages);
        }
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const getUnreadCount = (userId: string) => {
    if (!user) return 0;
    return allMessages.filter(
      (msg) => msg.senderId === userId && msg.receiverId === user.id && !msg.read
    ).length;
  };

  const getLastMessage = (userId: string) => {
    const userMessages = allMessages.filter(
      (msg) =>
        (msg.senderId === user?.id && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === user?.id)
    );
    return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
  };

  const getUserRole = (userId: string) => {
    const foundUser = users.find((u) => u.id === userId);
    return foundUser?.role || "";
  };

  const filteredUsers = users.filter((u) => 
    u.id !== user?.id && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-none md:rounded-xl border-0 md:border border-blue-500/30 flex h-[100dvh] relative overflow-hidden">
      {/* User List */}
      <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} md:w-72 md:translate-x-0 bg-black/95 md:bg-black/50 border-r border-blue-500/30 p-5 md:p-4 flex flex-col transition-all duration-300 overflow-hidden absolute md:relative z-20 h-full`}>
        <h3 className="text-white font-semibold mb-5 flex items-center text-lg">
          <span className="mr-2">💬</span> <span className="hidden md:inline">Direct Messages</span>
        </h3>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search people..."
          className="w-full bg-black/30 border border-blue-500/50 rounded-xl px-5 py-4 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 mb-5 text-lg shadow-inner"
        />
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-blue-300">Loading users...</div>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {filteredUsers.length === 0 ? (
              <p className="text-blue-300 text-base text-center py-6">No members found</p>
            ) : (
              filteredUsers.map((u) => {
                const unreadCount = getUnreadCount(u.id);
                const lastMessage = getLastMessage(u.id);
                const isOnline = onlineUsers.has(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-xl transition-colors group active:scale-98 ${
                      selectedUser?.id === u.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-blue-300 hover:bg-blue-900/50 active:bg-blue-900/70"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                          {u.name[0]}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black/50 shadow-md"></div>
                        )}
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold truncate text-lg">{u.name}</div>
                          {lastMessage && (
                            <div className="text-xs opacity-70 flex-shrink-0">
                              {new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm opacity-60 truncate flex-1">
                            {lastMessage ? lastMessage.text : u.role}
                          </div>
                          {isOnline && (
                            <div className="text-sm text-green-400 flex-shrink-0">●</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-30 text-blue-300 hover:text-white p-4 bg-black/70 rounded-2xl text-xl shadow-xl active:scale-95 transition-transform"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/30 min-w-0 h-full">
        {selectedUser ? (
          <>
            <div className="p-3 md:p-4 border-b border-blue-500/30 bg-black/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm md:text-sm font-semibold">
                    {selectedUser.name[0]}
                  </div>
                  {onlineUsers.has(selectedUser.id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-black/50"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base md:text-base">{selectedUser.name}</h2>
                  <div className="text-xs md:text-xs text-blue-300">
                    {onlineUsers.has(selectedUser.id) ? 'Active now' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-blue-300">
                  <div className="text-center">
                    <div className="text-5xl mb-3">💬</div>
                    <p className="text-base">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  const senderRole = getUserRole(msg.senderId);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[85%] md:max-w-[70%]">
                        {!isOwn && (
                          <div className="text-xs text-blue-300 mb-1 ml-1 flex items-center space-x-2">
                            <span>{selectedUser.name}</span>
                            {senderRole && (
                              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded">
                                {senderRole}
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 group ${
                            isOwn
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-black/50 text-blue-100 border border-blue-500/30 rounded-bl-sm"
                          }`}
                        >
                          <p className="break-words text-sm leading-relaxed">{msg.text}</p>
                          {msg.attachment && (
                            <div className="mt-2">
                              {msg.attachment.startsWith('data:image') ? (
                                <img src={msg.attachment} alt="Attachment" className="max-w-full h-auto rounded-lg max-h-48 md:max-h-64" />
                              ) : (
                                <a href={msg.attachment} download className="text-blue-200 hover:text-blue-100 text-sm underline inline-flex items-center gap-2 py-1">
                                  📎 Download attachment
                                </a>
                              )}
                            </div>
                          )}
                          <div className={`text-xs mt-1 flex items-center justify-between ${isOwn ? 'text-blue-200' : 'text-blue-300'}`}>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <div className="flex items-center space-x-2">
                              {isOwn && (
                                <span>✓✓</span>
                              )}
                              {(isOwn || user?.role === "super_admin") && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-red-400 hover:text-red-300 text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity px-2 py-1 -mx-2 -my-1 active:bg-red-500/20 rounded"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-2 md:p-4 border-t border-blue-500/30 bg-black/50 flex-shrink-0">
              <div className="flex flex-col space-y-2 md:space-y-3">
                {selectedFile && (
                  <div className="flex items-center space-x-2 bg-black/30 rounded-lg px-3 py-2">
                    <span className="text-blue-300 text-sm truncate flex-1">📎 {selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-400 hover:text-red-300 text-sm flex-shrink-0 p-1 active:bg-red-500/20 rounded transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex space-x-2">
                  <label className="text-blue-400 hover:text-blue-300 p-2 md:p-3 cursor-pointer flex-shrink-0 bg-black/30 rounded-lg active:bg-blue-900/50 transition-colors">
                    📎
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message ${selectedUser.name}...`}
                    className="flex-1 bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 md:px-4 md:py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 text-sm md:text-base"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!message.trim() && !selectedFile)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed active:bg-blue-800 text-white px-4 py-2 md:px-5 md:py-3 rounded-lg transition-colors text-sm md:text-base flex-shrink-0 font-medium shadow active:scale-95 transition-transform"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-blue-300">
            <div className="text-center">
              <div className="text-6xl md:text-6xl mb-5">💬</div>
              <h3 className="text-2xl md:text-xl font-semibold mb-3">Direct Messages</h3>
              <p className="text-base md:text-sm">Select a member to start a private conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
