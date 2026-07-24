"use client";

import { useState } from "react";
import Modal from "./Modal";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; priority: "low" | "medium" | "high"; dueDate: string }) => void;
}

export default function TaskModal({ isOpen, onClose, onSubmit }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate.trim(),
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description..."
            rows={3}
            className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
            className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">
            Due Date (Optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
