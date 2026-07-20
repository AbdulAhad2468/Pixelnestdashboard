"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

  // Fetch users and all messages
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          // Simulate online status (in real app, this would come from WebSocket)
          const usersWithStatus = data.map((u: User) => ({
            ...u,
            online: Math.random() > 0.3 // 70% chance of being online
          }));
          setUsers(usersWithStatus);
          setOnlineUsers(new Set(usersWithStatus.filter((u: User) => u.online).map((u: User) => u.id)));
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
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
    
    // Poll for messages and update online status
    const interval = setInterval(() => {
      fetchAllMessages();
      // Randomly update online status to simulate real-time
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        users.forEach(u => {
          if (Math.random() > 0.95) { // 5% chance to change status
            if (newSet.has(u.id)) {
              newSet.delete(u.id);
            } else {
              newSet.add(u.id);
            }
          }
        });
        return newSet;
      });
    }, 3000);
    return () => clearInterval(interval);
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
    if (!message.trim() || !user || !selectedUser) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedUser.id,
          text: message,
        }),
      });

      if (response.ok) {
        setMessage("");
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
      console.error("Failed to send message:", error);
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

  const filteredUsers = users.filter((u) => 
    u.id !== user?.id && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-blue-500/30 flex h-[600px]">
      {/* User List */}
      <div className="w-72 bg-black/50 border-r border-blue-500/30 p-4 flex flex-col">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <span className="mr-2">💬</span> Direct Messages
        </h3>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search people..."
          className="w-full bg-black/30 border border-blue-500/50 rounded-lg px-3 py-2 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 mb-4 text-sm"
        />
        <div className="space-y-1 overflow-y-auto flex-1">
          {filteredUsers.length === 0 ? (
            <p className="text-blue-300 text-sm text-center py-4">No members found</p>
          ) : (
            filteredUsers.map((u) => {
              const unreadCount = getUnreadCount(u.id);
              const lastMessage = getLastMessage(u.id);
              const isOnline = onlineUsers.has(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors group ${
                    selectedUser?.id === u.id
                      ? "bg-blue-600 text-white"
                      : "text-blue-300 hover:bg-blue-900/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {u.name[0]}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black/50"></div>
                      )}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold truncate text-sm">{u.name}</div>
                        {lastMessage && (
                          <div className="text-xs opacity-70 flex-shrink-0">
                            {new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs opacity-60 truncate flex-1">
                          {lastMessage ? lastMessage.text : u.role}
                        </div>
                        {isOnline && (
                          <div className="text-xs text-green-400 flex-shrink-0">●</div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/30">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-blue-500/30 bg-black/50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {selectedUser.name[0]}
                  </div>
                  {onlineUsers.has(selectedUser.id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black/50"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-white font-semibold">{selectedUser.name}</h2>
                  <div className="text-xs text-blue-300">
                    {onlineUsers.has(selectedUser.id) ? 'Active now' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-blue-300">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[70%]">
                        {!isOwn && (
                          <div className="text-xs text-blue-300 mb-1 ml-1">
                            {selectedUser.name}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-black/50 text-blue-100 border border-blue-500/30 rounded-bl-sm"
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-blue-300'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {isOwn && (
                              <span className="ml-2">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-blue-500/30 bg-black/50">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="text-blue-400 hover:text.blue-300 p-2"
                  title="Add attachment"
                >
                  📎
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Message ${selectedUser.name}...`}
                  className="flex-1 bg-black/30 border border-blue-500/50 rounded-lg px-4 py-2 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-blue-300">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Direct Messages</h3>
              <p>Select a member to start a private conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
