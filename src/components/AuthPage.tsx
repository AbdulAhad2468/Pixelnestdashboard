"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      const success = await login(email, password);
      if (!success) {
        setError("Invalid email or password");
      }
    } else {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      const success = await signup(email, password, name);
      if (!success) {
        setError("Email already exists");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-lg p-8 rounded-2xl border border-blue-500/30 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="Logo" className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-bold text-white text-center">
            {isLogin ? "Welcome Back" : "Join the Team"}
          </h1>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-blue-300 mb-2 text-sm">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-blue-300 mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-blue-300 mb-2 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-blue-300 hover:text-blue-200 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
