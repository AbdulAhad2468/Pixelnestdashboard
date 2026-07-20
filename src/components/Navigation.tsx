"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Sprint Board", href: "/board", icon: "📋" },
    { name: "Channels", href: "/channels", icon: "💬" },
    { name: "Direct Messages", href: "/messages", icon: "🔒" },
  ];

  if (user?.role === "admin") {
    navItems.push({ name: "Admin Panel", href: "/admin", icon: "⚙️" });
  }

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-black/50 backdrop-blur-lg border-b border-blue-500/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <span className="text-white font-bold text-lg md:text-xl hidden sm:block">
              Sprint Board
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-blue-300 hover:bg-blue-900/50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-blue-300 text-sm">
              <span className="font-semibold">{user?.name}</span>
              <span className="ml-2 opacity-70">({user?.role})</span>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <span className="text-blue-300 text-sm">{user?.name}</span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-blue-300 hover:text-white p-2"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-500/30 bg-black/50">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-blue-300 hover:bg-blue-900/50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="border-t border-blue-500/30 pt-3 mt-3">
              <button
                onClick={logout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
