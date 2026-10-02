import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RulePilot AI — Agentic Process Automation",
  description:
    "Transform static company policies into executable visual workflows and deterministic evaluations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
