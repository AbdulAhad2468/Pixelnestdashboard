"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthPage from "@/components/AuthPage";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/board");
    }
  }, [user, router]);

  if (user) {
    return null; // Don't render anything while redirecting
  }

  return <AuthPage />;
}
