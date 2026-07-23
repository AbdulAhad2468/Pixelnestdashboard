"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import KanbanBoard from "@/components/KanbanBoard";

export default function BoardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.approved === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <div className="bg-black/50 backdrop-blur-lg rounded-xl border border-blue-500/30 p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Access Pending</h2>
            <p className="text-blue-300">Please wait for an admin to approve your account before accessing the Sprint Board.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black">
      <Navigation />
      <KanbanBoard />
    </div>
  );
}
