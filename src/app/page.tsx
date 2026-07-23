"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthPage from "@/components/AuthPage";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.approved !== false) {
      router.push("/board");
    }
  }, [user, router]);

  if (!user) {
    return <AuthPage />;
  }

  if (user.approved === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-lg rounded-xl border border-blue-500/30 p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Pending</h2>
          <p className="text-blue-300 mb-6">
            Your account is waiting for admin approval. Please contact an administrator.
          </p>
          <button
            onClick={() => {
              logout();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return null; // Approved user is being redirected
}
