import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RulePilot AI — Agentic Process Automation",
  description:
    "Transform static company policies into executable visual workflows and deterministic evaluations.",
};

import { SessionProvider } from "@/components/session/SessionProvider";
import { Navbar } from "@/components/layout/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-[#0a0f18] text-white selection:bg-cyan-500/30">
        <SessionProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
