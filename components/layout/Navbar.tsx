"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/session/SessionProvider";
import { RefreshCw, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { session, startOver } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === "/") {
    return null;
  }

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Policies", href: "/policies" },
    { name: "Workflows", href: "/workflows" },
    { name: "Cases", href: "/cases" },
  ];

  return (
    <header className="border-b border-[#2b5a6c]/30 bg-[#0a0f18]/90 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#4bbabc] to-[#9a75d5] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(75,186,188,0.3)] group-hover:shadow-[0_0_25px_rgba(154,117,213,0.5)] transition-shadow">
              RP
            </div>
            <span className="font-bold text-lg text-white tracking-tight hidden sm:block">RulePilot AI</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-2">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-[#4bbabc]/10 text-[#4bbabc]" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {session.documentId && (
            <button
              onClick={startOver}
              className="hidden sm:flex items-center space-x-2 text-sm text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-500/10"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Start Over</span>
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#2b5a6c]/30 bg-[#0d1b2a] px-4 py-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  isActive 
                    ? "bg-[#4bbabc]/10 text-[#4bbabc]" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          
          {session.documentId && (
            <div className="pt-4 mt-2 border-t border-[#2b5a6c]/30">
              <button
                onClick={() => {
                  startOver();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 text-base text-rose-400 transition-colors px-4 py-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Start Over</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
