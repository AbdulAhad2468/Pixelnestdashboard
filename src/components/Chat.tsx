"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

interface Channel {
  id: string;
  name: string;
  messages: Message[];
}

export default function Chat() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [message, setMessage] = useState("");

  const activeChannelData = channels.find((c) => c.id === activeChannel);

  // Fetch channels
  const fetchChannels = async () => {
    try {
      const response = await fetch("/api/channels");
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    }
  };

  useEffect(() => {
    fetchChannels();
    const interval = setInterval(fetchChannels, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChannel) return;

    try {
      const response = await fetch(`/api/channels/${activeChannel}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, sender: user?.name || "Anonymous" }),
      });

      if (response.ok) {
        setMessage("");
        fetchChannels(); // Refresh messages
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCreateChannel = async () => {
    const name = prompt("Enter channel name:");
    if (!name) return;

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        fetchChannels();
      }
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-blue-500/30 flex h-[600px]">
      {/* Sidebar */}
      <div className="w-64 bg-black/50 border-r border-blue-500/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Channels</h3>
          <button
            onClick={handleCreateChannel}
            className="text-blue-400 hover:text-blue-300 text-2xl"
          >
            +
          </button>
        </div>
        <div className="space-y-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeChannel === channel.id
                  ? "bg-blue-600 text-white"
                  : "text-blue-300 hover:bg-blue-900/50"
              }`}
            >
              # {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-blue-500/30">
          <h2 className="text-white font-semibold">#{activeChannelData?.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeChannelData?.messages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {msg.sender[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-sm">{msg.sender}</span>
                  <span className="text-blue-300 text-xs">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-blue-100">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-blue-500/30">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-black/50 border border-blue-500/50 rounded-lg px-4 py-2 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
