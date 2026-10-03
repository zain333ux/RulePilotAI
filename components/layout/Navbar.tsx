"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/session/SessionProvider";
import { RefreshCw } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { session, startOver } = useSession();

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
    <header className="border-b border-indigo-500/20 bg-[#0a0f18]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-lg shadow-black/20">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] transition-shadow">
            RP
          </div>
          <span className="font-bold text-lg text-white tracking-tight">RulePilot AI</span>
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
                  ? "bg-indigo-500/10 text-cyan-400" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center">
        {session.documentId && (
          <button
            onClick={startOver}
            className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-500/10"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        )}
      </div>
    </header>
  );
}
