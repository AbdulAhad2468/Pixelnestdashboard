"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isApproved = user?.approved !== false;

  const navItems = [
    { name: "Pixel Nest", href: "/board" },
    { name: "Channels", href: "/channels" },
    { name: "Direct Messages", href: "/messages" },
  ];

  const visibleNavItems = isApproved ? [...navItems] : [];

  if (user?.role === "admin") {
    visibleNavItems.push({ name: "Admin Panel", href: "/admin" });
  }

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-black/50 backdrop-blur-lg border-b border-blue-500/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <span className="text-white font-bold text-base sm:text-lg md:text-xl">
              Pixel Nest
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-blue-300 hover:bg-blue-900/50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <div className="text-blue-300 text-xs lg:text-sm">
              <span className="font-semibold">{user?.name}</span>
              <span className="ml-1 lg:ml-2 opacity-70">({user?.role})</span>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-xs lg:text-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <span className="text-blue-300 text-sm truncate max-w-[100px]">{user?.name}</span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-blue-300 hover:text-white p-2 text-xl"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-500/30 bg-black/50 absolute w-full left-0 top-16 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-blue-300 hover:bg-blue-900/50"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-blue-500/30 pt-3 mt-3">
              <button
                onClick={logout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
