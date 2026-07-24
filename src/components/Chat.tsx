"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ChannelModal from "./ChannelModal";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  attachment?: string;
}

interface Channel {
  id: string;
  name: string;
  messages: Message[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "member";
}

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeChannel, setActiveChannel] = useState("general");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Fetch channels with React Query
  const { data: channels = [], isLoading, error: channelsError } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await fetch("/api/channels");
      if (!response.ok) throw new Error("Failed to fetch channels");
      return response.json();
    },
    staleTime: 0, // Always fresh for real-time
  });

  // Fetch users with React Query
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const activeChannelData = channels.find((c: Channel) => c.id === activeChannel);

  // Set up real-time subscriptions
  useEffect(() => {
    setConnectionStatus('connecting');

    // Subscribe to channel messages for real-time updates
    const messagesChannel = supabase
      .channel('channel-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_messages'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      });

    // Subscribe to channels changes
    const channelsSubscription = supabase
      .channel('channels-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channels'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(channelsSubscription);
    };
  }, [queryClient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;
    if (!activeChannel) return;
    if (!user?.id) {
      setError("You must be logged in to send messages");
      return;
    }

    setSending(true);
    setError(null);

    try {
      let attachment = null;
      if (selectedFile) {
        // Convert file to base64 for storage
        const reader = new FileReader();
        attachment = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }

      const response = await fetch(`/api/channels/${activeChannel}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message,
          senderId: user.id,
          attachment
        }),
      });

      if (response.ok) {
        setMessage("");
        setSelectedFile(null);
        queryClient.invalidateQueries({ queryKey: ['channels'] });
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

  const handleCreateChannel = () => {
    setShowChannelModal(true);
  };

  const handleChannelSubmit = async (name: string) => {
    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      }
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Are you sure you want to delete this channel? All messages will be lost.")) return;

    try {
      const response = await fetch("/api/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: channelId }),
      });

      if (response.ok) {
        // If the deleted channel was active, switch to the first available channel
        if (activeChannel === channelId) {
          const remainingChannels = channels.filter((c: Channel) => c.id !== channelId);
          setActiveChannel(remainingChannels.length > 0 ? remainingChannels[0].id : "");
        }
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      }
    } catch (error) {
      console.error("Failed to delete channel:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/channels/${activeChannel}/messages`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['channels'] });
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const getUserRole = (senderName: string) => {
    const foundUser = users.find((u: User) => u.name === senderName);
    return foundUser?.role || "";
  };

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-none md:rounded-xl border-0 md:border border-blue-500/30 flex h-[100dvh] relative overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} md:w-64 md:translate-x-0 bg-black/95 md:bg-black/50 border-r border-blue-500/30 p-5 md:p-4 transition-all duration-300 overflow-hidden absolute md:relative z-20 h-full`}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-white font-semibold text-lg hidden md:block">Channels</span>
          {user?.role === "super_admin" && (
            <button
              onClick={handleCreateChannel}
              className="text-blue-400 hover:text-blue-300 text-3xl p-3 -m-3 active:scale-95 transition-transform"
            >
              +
            </button>
          )}
        </div>
        <div className="space-y-2">
          {channels.map((channel: Channel) => (
            <div
              key={channel.id}
              className={`flex items-center group ${
                activeChannel === channel.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-blue-300 hover:bg-blue-900/50 active:bg-blue-900/70"
              } rounded-xl transition-colors`}
            >
              <button
                onClick={() => {
                  setActiveChannel(channel.id);
                  setSidebarOpen(false);
                }}
                className="flex-1 text-left px-5 py-4 text-lg active:scale-98"
              >
                # {channel.name}
              </button>
              {user?.role === "super_admin" && (
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="text-red-400 hover:text-red-300 px-3 py-4 opacity-0 group-hover:opacity-100 transition-opacity active:bg-red-500/20 rounded-r-xl"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-30 text-blue-300 hover:text-white p-4 bg-black/70 rounded-2xl text-xl shadow-xl active:scale-95 transition-transform"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="p-3 md:p-4 border-b border-blue-500/30 flex items-center justify-between bg-black/20 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-white font-semibold text-base md:text-base">#{activeChannelData?.name}</h2>
            <div className={`flex items-center space-x-1.5 text-xs ${
              connectionStatus === 'connected' ? 'text-green-400' :
              connectionStatus === 'connecting' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`}></span>
              <span className="hidden sm:inline">{connectionStatus}</span>
            </div>
          </div>
          {user?.role === "super_admin" && (
            <button
              onClick={handleCreateChannel}
              className="text-blue-400 hover:text-blue-300 text-xl p-2 -m-2 active:scale-95 transition-transform"
            >
              +
            </button>
          )}
        </div>

        {error && (
          <div className="mx-3 md:mx-4 mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-blue-300">Loading channels...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
            {activeChannelData?.messages.map((msg: Message) => {
              const senderUser = users.find((u: User) => u.id === msg.senderId);
              const senderName = senderUser?.name || "Unknown";
              const userRole = getUserRole(senderName);
              return (
                <div key={msg.id} className="flex items-start space-x-3 md:space-x-3 group">
                  <div className="w-8 h-8 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm md:text-sm font-semibold flex-shrink-0">
                    {senderName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-white font-semibold text-sm md:text-sm">{senderName}</span>
                      {userRole && (
                        <span className="bg-blue-500/20 text-blue-300 text-xs md:text-xs px-2 py-0.5 rounded">
                          {userRole}
                        </span>
                      )}
                      <span className="text-blue-300 text-xs md:text-xs">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {(msg.senderId === user?.id || user?.role === "super_admin") && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-red-400 hover:text-red-300 text-xs md:text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity px-2 py-1 -mx-2 -my-1 active:bg-red-500/20 rounded"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-blue-100 break-words text-sm md:text-sm leading-relaxed">{msg.text}</p>
                    {msg.attachment && (
                      <div className="mt-2">
                        {msg.attachment.startsWith('data:image') ? (
                          <img src={msg.attachment} alt="Attachment" className="max-w-full h-auto rounded-lg max-h-48 md:max-h-64" />
                        ) : (
                          <a href={msg.attachment} download className="text-blue-400 hover:text-blue-300 text-sm md:text-sm underline inline-flex items-center gap-2 py-1">
                            📎 Download attachment
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-2 md:p-4 border-t border-blue-500/30 bg-black/20 flex-shrink-0">
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
                placeholder="Type a message..."
                className="flex-1 bg-black/50 border border-blue-500/50 rounded-lg px-3 py-2 md:px-4 md:py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 text-sm md:text-base"
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
      </div>

      <ChannelModal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        onSubmit={handleChannelSubmit}
      />
    </div>
  );
}
