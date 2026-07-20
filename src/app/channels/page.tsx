"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Chat from "@/components/Chat";

export default function ChannelsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black">
      <Navigation />
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Channels</h1>
        <Chat />
      </div>
    </div>
  );
}
