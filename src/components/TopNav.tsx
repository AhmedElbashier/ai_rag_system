"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, User, Menu, X, FileText, MessageSquare, Code2, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Chat",      href: "/chat",      icon: MessageSquare },
  { label: "API",       href: "/api-reference", icon: Code2 },
  { label: "Settings",  href: "/settings",  icon: Settings },
];

export default function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === "/documents" && pathname === "/") return true;
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[oklch(0.10_0_0/0.90)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[oklch(0.55_0.18_160/0.15)] border border-[oklch(0.65_0.18_160/0.30)]">
              <BrainCircuit className="w-4 h-4 text-[oklch(0.75_0.18_160)]" />
              <span className="absolute inset-0 rounded-lg animate-pulse bg-[oklch(0.65_0.18_160/0.08)]" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white/90">DocuMind</span>
          </Link>

          {/* Desktop Nav Links */}
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

          {/* Right: User + Hamburger */}
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.07] border border-white/[0.10] text-white/60 hover:text-white hover:border-white/20 transition-all">
              <User className="w-4 h-4" />
            </button>

            {/* Hamburger — mobile only */}
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white transition-colors"
              style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {menuOpen ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "oklch(0 0 0 / 0.60)", backdropFilter: "blur(4px)" }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.nav
              key="drawer"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: "0%" }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 md:hidden w-[72vw] max-w-[280px] flex flex-col"
              style={{
                background: "oklch(0.12 0.005 240 / 0.98)",
                backdropFilter: "blur(24px)",
                borderLeft: "1px solid oklch(1 0 0 / 0.07)",
              }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-white/70">Navigation</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white transition-colors"
                  style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item, i) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                        style={active ? {
                          background: "oklch(0.55 0.18 160 / 0.14)",
                          border: "1px solid oklch(0.65 0.18 160 / 0.25)",
                          color: "oklch(0.75 0.18 160)",
                        } : {
                          background: "oklch(1 0 0 / 0.03)",
                          border: "1px solid oklch(1 0 0 / 0.06)",
                          color: "oklch(0.65 0 0)",
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {item.label}
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.18_160)]" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/[0.05]">
                <p className="text-[10px] text-white/20 text-center">DocuMind · Powered by Gemini AI</p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
