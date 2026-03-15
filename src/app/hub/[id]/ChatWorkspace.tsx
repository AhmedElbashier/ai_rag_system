"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User, FileText, ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { UIMessage } from "ai";

interface ChatWorkspaceProps {
  documentId: string;
  documentUrl: string;
  documentName: string;
}

/** Extract plain text from a UIMessage (ai@6 uses parts[], not a content string) */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

/** Extract all "Page N" citations from an AI reply */
function extractPages(text: string): number[] {
  const matches = [...text.matchAll(/\bpage\s+(\d+)\b/gi)];
  return [...new Set(matches.map((m) => parseInt(m[1], 10)))].filter(
    (n) => !isNaN(n) && n > 0
  );
}

export default function ChatWorkspace({ documentId, documentUrl, documentName }: ChatWorkspaceProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ai@6 / @ai-sdk/react v3: configure via transport instead of api/body props
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { documentId }, // sent with every request
    }),
  });

  // Set welcome message on mount — UIMessage uses parts[], not content
  useEffect(() => {
    setMessages([{
      id: "sys-1",
      role: "assistant",
      parts: [{
        type: "text" as const,
        text: `Hi there! I've analyzed **${documentName}**. Ask me anything — I'll cite page numbers so you can verify.`,
      }],
      metadata: undefined,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Auto-jump PDF to the first page cited in the latest assistant reply
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant && lastAssistant.id !== "sys-1") {
      const pages = extractPages(getMessageText(lastAssistant));
      if (pages.length > 0) setCurrentPage(pages[0]);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const jumpToPage = useCallback((page: number) => setCurrentPage(page), []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text }); // ai@6 shorthand: { text } instead of { role, content }
    setInput("");
  };

  const isLoading = status === "streaming" || status === "submitted";
  const pdfSrc = `${documentUrl}#page=${currentPage}&toolbar=0&navpanes=0`;

  return (
    <div className="flex h-screen w-full bg-[oklch(0.10_0_0)] text-white overflow-hidden dark">

      {/* ── LEFT: PDF Viewer ── */}
      <div className="flex-1 border-r border-white/[0.06] hidden md:flex flex-col relative bg-[oklch(0.12_0.003_240)]">
        {/* Toolbar */}
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 bg-[oklch(0.12_0.003_240/0.95)] backdrop-blur z-10 sticky top-0 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white transition-colors"
              style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md"
                style={{ background: "oklch(0.55 0.18 160 / 0.15)", border: "1px solid oklch(0.65 0.18 160 / 0.25)" }}>
                <FileText className="h-3 w-3 text-[oklch(0.72_0.18_160)]" />
              </div>
              <span className="font-medium text-xs text-white/70 truncate max-w-[260px]">{documentName}</span>
            </div>
          </div>
          <span className="text-[11px] text-white/30 font-mono">p.{currentPage}</span>
        </div>

        {/* PDF iframe — key forces reload when page changes */}
        <div className="flex-1 relative">
          <iframe
            key={pdfSrc}
            src={pdfSrc}
            className="w-full h-full border-0 absolute inset-0 bg-[oklch(0.14_0_0)]"
            title={documentName}
          />
        </div>
      </div>

      {/* ── RIGHT: Chat ── */}
      <div className="w-full md:w-[580px] lg:w-[640px] flex flex-col h-screen"
        style={{ background: "oklch(0.11 0.003 240)" }}>

        {/* Header */}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 scroll-smooth">
          <div className="max-w-2xl mx-auto space-y-7 pb-4">
            {messages.map((m) => {
              const text = getMessageText(m);
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
                    <p className="text-[11px] font-medium text-white/30">
                      {m.role === "user" ? "You" : "Assistant"}
                    </p>
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed
                      prose-p:text-white/75 prose-p:leading-relaxed prose-strong:text-white/90
                      prose-code:text-[oklch(0.72_0.18_160)] prose-code:bg-white/[0.06] prose-code:px-1 prose-code:rounded
                      prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.08]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                    </div>

                    {pages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pages.map((page) => (
                          <button
                            key={page}
                            onClick={() => jumpToPage(page)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
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
                  <span className="text-xs text-white/35">Searching document memory...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]" style={{ background: "oklch(0.12 0.003 240)" }}>
          <div
            className="relative flex items-end w-full overflow-hidden rounded-xl transition-all duration-200"
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
              placeholder="Ask a question about this document..."
              className="flex-1 min-h-[52px] max-h-[180px] w-full resize-none border-0 bg-transparent py-3.5 pl-4 pr-12 text-sm text-white/80 placeholder-white/25 outline-none"
              style={{ height: "52px" }}
            />
            <div className="absolute right-2.5 bottom-2.5">
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-7 w-7 rounded-lg text-white disabled:opacity-30 transition-all"
                style={{
                  background: "oklch(0.55 0.18 160 / 0.80)",
                  border: "1px solid oklch(0.65 0.18 160 / 0.40)",
                }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-center mt-2 text-[10px] text-white/20">
            AI can make mistakes. Click page citations to verify sources.
          </p>
        </div>
      </div>
    </div>
  );
}
