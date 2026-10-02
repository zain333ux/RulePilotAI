import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            RP
          </div>
          <span className="font-bold text-lg text-white tracking-tight">RulePilot AI</span>
        </Link>
      </div>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          Dashboard
        </Link>
        <Link href="/policies/upload" className="text-zinc-400 hover:text-white transition-colors">
          Policies
        </Link>
        <Link href="/workflows" className="text-zinc-400 hover:text-white transition-colors">
          Workflows
        </Link>
        <Link href="/cases" className="text-zinc-400 hover:text-white transition-colors">
          Cases
        </Link>
      </nav>
    </header>
  );
}
