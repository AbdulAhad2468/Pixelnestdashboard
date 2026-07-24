"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthPage from "@/components/AuthPage";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/board");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return null; // User is being redirected
}
