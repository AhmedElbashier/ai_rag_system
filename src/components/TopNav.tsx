"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, User } from "lucide-react";

const navItems = [
  { label: "Documents", href: "/documents" },
  { label: "Chat",      href: "/chat" },
  { label: "API",       href: "/api-reference" },
  { label: "Settings",  href: "/settings" },
];

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/documents" && pathname === "/") return true;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[oklch(0.10_0_0/0.80)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[oklch(0.55_0.18_160/0.15)] border border-[oklch(0.65_0.18_160/0.30)]">
            <BrainCircuit className="w-4 h-4 text-[oklch(0.75_0.18_160)]" />
            <span className="absolute inset-0 rounded-lg animate-pulse bg-[oklch(0.65_0.18_160/0.08)]" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">DocuMind</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.10] text-white/60 hover:text-white hover:border-white/20 transition-all">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
