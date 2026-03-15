"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send, Bot, User, FileText, ArrowLeft,
  Loader2, BookOpen, FileSearch, MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { UIMessage } from "ai";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ChatWorkspaceProps {
  documentId: string;
  documentUrl: string;
  documentName: string;
}

type ActiveTab = "pdf" | "chat";

/** Extract plain text from a UIMessage (ai@6 stores content in parts[]) */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

/** Extract all "Page N" citations */
function extractPages(text: string): number[] {
  const matches = [...text.matchAll(/\bpage\s+(\d+)\b/gi)];
  return [...new Set(matches.map((m) => parseInt(m[1], 10)))].filter(
    (n) => !isNaN(n) && n > 0
  );
}

export default function ChatWorkspace({ documentId, documentUrl, documentName }: ChatWorkspaceProps) {
  const router   = useRouter();
  const isMobile = useIsMobile();

  // ── Chat state ──
  const [input, setInput]           = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Mobile tab state ──
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");

  // ── Tablet draggable divider ──
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct]     = useState(60); // % width for PDF panel
  const isDragging                = useRef(false);

  const onDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDividerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct  = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(75, Math.max(25, pct)));
  };
  const onDividerPointerUp = () => { isDragging.current = false; };

  // ── Keyboard / Visual Viewport awareness ──
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      // When soft keyboard opens, vv.height shrinks — push the input up
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // ── ai@6: useChat with transport instead of api/body ──
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { documentId },
    }),
  });

  // Welcome message (parts-based UIMessage format)
  useEffect(() => {
    setMessages([{
      id: "sys-1",
      role: "assistant",
      parts: [{
        type: "text" as const,
        text: `Hi! I've analyzed **${documentName}**. Ask me anything — I'll cite the exact page numbers so you can verify instantly.`,
      }],
      metadata: undefined,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Auto-jump PDF to the first cited page in the latest assistant reply
  useEffect(() => {
    const lastAI = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAI && lastAI.id !== "sys-1") {
      const pages = extractPages(getMessageText(lastAI));
      if (pages.length > 0) {
        setCurrentPage(pages[0]);
        // On mobile: switch to PDF tab so user can see the citation
        if (isMobile) setActiveTab("pdf");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status, activeTab]);

  const jumpToPage = useCallback((page: number) => {
    setCurrentPage(page);
    if (isMobile) setActiveTab("pdf");
  }, [isMobile]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text });
    setInput("");
    if (isMobile) setActiveTab("chat"); // stay on chat after sending
  };

  const isLoading = status === "streaming" || status === "submitted";
  const pdfSrc    = `${documentUrl}#page=${currentPage}&toolbar=0&navpanes=0`;

  // ────────────────────────────────────────────────────────────
  //  Shared sub-components
  // ────────────────────────────────────────────────────────────

  /** Top toolbar that appears in both mobile + desktop */
  const Toolbar = ({ showBack = true }: { showBack?: boolean }) => (
    <div
      className="h-12 border-b border-white/[0.06] flex items-center px-4 shrink-0 justify-between"
      style={{ background: "oklch(0.12 0.003 240 / 0.95)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white transition-colors"
            style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md"
            style={{ background: "oklch(0.55 0.18 160 / 0.15)", border: "1px solid oklch(0.65 0.18 160 / 0.25)" }}>
            <FileText className="h-3 w-3 text-[oklch(0.72_0.18_160)]" />
          </div>
          <span className="font-medium text-xs text-white/70 truncate max-w-[180px] md:max-w-[260px]">{documentName}</span>
        </div>
      </div>
      <span className="text-[11px] text-white/30 font-mono">p.{currentPage}</span>
    </div>
  );

  /** PDF iframe panel */
  const PDFPanel = () => (
    <div className="flex-1 relative bg-[oklch(0.12_0.003_240)]">
      <iframe
        key={pdfSrc}
        src={pdfSrc}
        className="w-full h-full border-0 absolute inset-0 bg-[oklch(0.14_0_0)]"
        title={documentName}
      />
    </div>
  );

  /** Chat messages list */
  const MessageList = () => (
    <div className="flex-1 overflow-y-auto px-4 md:px-5 py-5 md:py-6 scroll-smooth overscroll-contain">
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-7 pb-4">
        {messages.map((m) => {
          const text  = getMessageText(m);
          const pages = m.role === "assistant" ? extractPages(text) : [];
          return (
            <div key={m.id} className="flex gap-3 w-full">
              <div className="shrink-0 mt-0.5">
                {m.role === "user" ? (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "oklch(1 0 0 / 0.07)", border: "1px solid oklch(1 0 0 / 0.10)" }}>
                    <User className="w-3.5 h-3.5 text-white/50" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "oklch(0.55 0.18 160 / 0.15)", border: "1px solid oklch(0.65 0.18 160 / 0.25)" }}>
                    <Bot className="w-3.5 h-3.5 text-[oklch(0.72_0.18_160)]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-[11px] font-medium text-white/30">{m.role === "user" ? "You" : "Assistant"}</p>
                {/* Prose — overflow-x: auto prevents horizontal scroll from code blocks */}
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed
                  prose-p:text-white/75 prose-p:leading-relaxed prose-strong:text-white/90
                  prose-code:text-[oklch(0.72_0.18_160)] prose-code:bg-white/[0.06] prose-code:px-1 prose-code:rounded prose-code:text-[0.78em] prose-code:break-words
                  prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.08] prose-pre:overflow-x-auto prose-pre:max-w-full
                  [&_pre]:max-w-full [&_pre]:overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                </div>
                {/* Page citation chips */}
                {pages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => jumpToPage(page)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all active:scale-[0.96]"
                        style={{
                          background: currentPage === page ? "oklch(0.55 0.18 160 / 0.25)" : "oklch(0.55 0.18 160 / 0.10)",
                          border: currentPage === page ? "1px solid oklch(0.65 0.18 160 / 0.50)" : "1px solid oklch(0.65 0.18 160 / 0.20)",
                          color: "oklch(0.72 0.18 160)",
                          boxShadow: currentPage === page ? "0 0 8px oklch(0.65 0.18 160 / 0.20)" : "none",
                        }}
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        Page {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 w-full animate-in fade-in duration-300">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "oklch(0.55 0.18 160 / 0.15)", border: "1px solid oklch(0.65 0.18 160 / 0.25)" }}>
              <Bot className="w-3.5 h-3.5 text-[oklch(0.72_0.18_160)]" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[oklch(0.65_0.18_160)]" />
              <span className="text-xs text-white/35">Searching document memory…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );

  /** Chat input box — keyboard offset applied via paddingBottom on mobile */
  const ChatInput = () => (
    <div
      className="border-t border-white/[0.06] p-3 md:p-4 transition-all duration-100"
      style={{
        background: "oklch(0.12 0.003 240)",
        paddingBottom: isMobile ? `${12 + keyboardOffset}px` : undefined,
      }}
    >
      <div
        className="relative flex items-end w-full overflow-hidden rounded-xl"
        style={{ background: "oklch(0.16 0.005 240 / 0.80)", border: "1px solid oklch(1 0 0 / 0.10)" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask a question about this document…"
          rows={1}
          className="flex-1 min-h-[48px] max-h-[160px] w-full resize-none border-0 bg-transparent py-3 pl-4 pr-12 text-sm text-white/80 placeholder-white/25 outline-none leading-relaxed"
          style={{ height: "48px" }}
          onInput={(e) => {
            // Auto-resize
            const t = e.currentTarget;
            t.style.height = "48px";
            t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
          }}
        />
        <div className="absolute right-2.5 bottom-2">
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 rounded-lg text-white disabled:opacity-30 transition-all"
            style={{
              background: "oklch(0.55 0.18 160 / 0.80)",
              border: "1px solid oklch(0.65 0.18 160 / 0.40)",
            }}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-center mt-1.5 text-[10px] text-white/20">
        Click page badges to jump the PDF viewer
      </p>
    </div>
  );

  // ────────────────────────────────────────────────────────────
  //  MOBILE LAYOUT: Tabbed full-screen panels
  // ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-[oklch(0.10_0_0)] text-white dark overflow-hidden">
        {/* Shared toolbar */}
        <Toolbar />

        {/* Tab switcher */}
        <div className="shrink-0 px-3 pt-2 pb-1">
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            {([
              { id: "chat" as const, icon: MessageSquare, label: "AI Chat" },
              { id: "pdf"  as const, icon: FileSearch,    label: "Document" },
            ] as const).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97]"
                  style={active ? {
                    background: "oklch(0.55 0.18 160 / 0.20)",
                    border: "1px solid oklch(0.65 0.18 160 / 0.30)",
                    color: "oklch(0.75 0.18 160)",
                    boxShadow: "0 0 12px oklch(0.65 0.18 160 / 0.15)",
                  } : {
                    background: "transparent",
                    border: "1px solid transparent",
                    color: "oklch(0.55 0 0)",
                  }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel content — animated slide */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "chat" ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col"
                style={{ background: "oklch(0.11 0.003 240)" }}
              >
                <MessageList />
                <ChatInput />
              </motion.div>
            ) : (
              <motion.div
                key="pdf"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col bg-[oklch(0.12_0.003_240)]"
              >
                <PDFPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile floating back-to-chat badge when on PDF tab */}
        <AnimatePresence>
          {activeTab === "pdf" && (
            <motion.button
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveTab("chat")}
              className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white shadow-lg"
              style={{
                background: "oklch(0.55 0.18 160 / 0.90)",
                border: "1px solid oklch(0.65 0.18 160 / 0.50)",
                boxShadow: "0 0 20px oklch(0.65 0.18 160 / 0.35)",
                backdropFilter: "blur(8px)",
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Back to Chat
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  //  DESKTOP / TABLET LAYOUT: Split-screen with draggable divider
  // ────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="flex h-screen w-full bg-[oklch(0.10_0_0)] text-white overflow-hidden dark select-none"
    >
      {/* ── LEFT: PDF Viewer ── */}
      <div
        className="flex flex-col border-r border-white/[0.06] bg-[oklch(0.12_0.003_240)]"
        style={{ width: `${leftPct}%` }}
      >
        <Toolbar />
        <PDFPanel />
      </div>

      {/* ── Draggable Divider ── */}
      <div
        onPointerDown={onDividerPointerDown}
        onPointerMove={onDividerPointerMove}
        onPointerUp={onDividerPointerUp}
        className="relative flex items-center justify-center w-[6px] shrink-0 cursor-col-resize group z-10"
        style={{ background: "oklch(1 0 0 / 0.02)" }}
        title="Drag to resize"
      >
        {/* Wider invisible hit area */}
        <div className="absolute inset-y-0 -left-2 -right-2" />
        {/* Visual handle pill */}
        <div
          className="w-[3px] h-10 rounded-full transition-all duration-150 group-hover:h-16"
          style={{ background: "oklch(0.65 0.18 160 / 0.25)" }}
        />
      </div>

      {/* ── RIGHT: Chat ── */}
      <div
        className="flex flex-col h-screen overflow-hidden"
        style={{ flex: 1, background: "oklch(0.11 0.003 240)" }}
      >
        {/* Chat header */}
        <div className="h-12 border-b border-white/[0.06] flex items-center px-5 shrink-0"
          style={{ background: "oklch(0.12 0.003 240 / 0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: "oklch(0.55 0.18 160 / 0.15)", border: "1px solid oklch(0.65 0.18 160 / 0.25)" }}>
              <Bot className="w-3 h-3 text-[oklch(0.72_0.18_160)]" />
            </div>
            <span className="text-sm font-medium text-white/70">Document Assistant</span>
          </div>
        </div>

        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
}
