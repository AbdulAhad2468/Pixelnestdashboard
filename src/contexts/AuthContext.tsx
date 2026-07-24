"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "member";
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "member";
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, name: string, role?: "super_admin" | "member") => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        setUser(profile);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Invalid email or password" };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: "super_admin" | "member" = "member"
  ): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        setUser(profile);
        return { success: true };
      }

      return { success: false, error: "Signup failed" };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { success: false, error: error.message || "Signup failed" };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const profile = await fetchProfile(user.id);
      setUser(profile);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
