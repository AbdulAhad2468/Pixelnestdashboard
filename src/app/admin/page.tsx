"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black">
      <Navigation />
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Admin Panel</h1>
        <AdminPanel />
      </div>
    </div>
  );
}
