"use client";

import { useState } from "react";
import Modal from "./Modal";

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function BoardModal({ isOpen, onClose, onSubmit }: BoardModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-blue-300 text-sm font-medium mb-2">
            Board Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name..."
            className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors"
            autoFocus
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
            disabled={!name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Create Board
          </button>
        </div>
      </form>
    </Modal>
  );
}
