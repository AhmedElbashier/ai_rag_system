"use client";

// @ts-expect-error ignores React19 compat node modules ts resolution problem
import { useChat } from "ai/react";
import { Send, Bot, User, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ChatWorkspaceProps {
  documentId: string;
  documentUrl: string;
  documentName: string;
}

export default function ChatWorkspace({ documentId, documentUrl, documentName }: ChatWorkspaceProps) {
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { documentId },
    initialMessages: [
      {
        id: "sys-1",
        role: "assistant",
        content: `Hi there! I've successfully analyzed **${documentName}**. You can ask me any questions about it. I will provide answers with page citations from the document.`,
      },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex h-screen w-full bg-[#fdfdfc] dark:bg-[#0a0a0a] text-foreground">
      {/* LEFT PANEL: PDF Viewer */}
      <div className="flex-1 border-r border-border/50 hidden md:flex flex-col relative bg-muted/10">
        <div className="h-14 border-b border-border/50 flex items-center px-4 bg-background/95 backdrop-blur z-10 sticky top-0 justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8 text-muted-foreground mr-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-1.5 bg-primary/10 rounded-md">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-sm truncate max-w-[300px]">{documentName}</span>
          </div>
        </div>
        <div className="flex-1 w-full relative">
          <iframe 
            src={`${documentUrl}#toolbar=0&navpanes=0`} 
            className="w-full h-full border-0 absolute inset-0" 
            title={documentName}
          />
        </div>
      </div>

      {/* RIGHT PANEL: Chat Interface (Claude-Style Minimalist) */}
      <div className="w-full md:w-[600px] lg:w-[700px] flex flex-col bg-background h-screen relative shadow-2xl md:shadow-none">
        {/* Chat Header */}
        <div className="h-14 border-b border-border/50 flex items-center px-6 bg-background/95 backdrop-blur z-10 shrink-0">
          <span className="font-medium text-sm text-muted-foreground">Chat Assistant</span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {messages.map((m: any) => (
              <div key={m.id} className="group relative flex gap-4 w-full">
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {m.role === "user" ? (
                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center border border-border/50 shadow-sm">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                  <div className="font-medium text-xs text-muted-foreground mb-1">
                    {m.role === "user" ? "You" : "Document Assistant"}
                  </div>
                  <div className={`prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border/50
                     ${m.role === 'user' ? 'text-foreground' : 'text-foreground/90'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="group relative flex gap-4 w-full animate-in fade-in duration-500">
                <div className="shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                     <Bot className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex items-center">
                   <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                   <span className="ml-2 text-sm text-muted-foreground">Searching document memory...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={handleSubmit} 
              className="relative flex items-end w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-shadow duration-200"
            >
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if(input.trim()) handleSubmit(e as any);
                  }
                }}
                placeholder="Ask a question about this document..."
                className="flex-1 min-h-[60px] max-h-[200px] w-full resize-none border-0 bg-transparent py-4 pl-4 pr-12 text-sm focus:ring-0 text-foreground placeholder-muted-foreground outline-none"
                style={{ height: "60px" }}
              />
              <div className="absolute right-2 bottom-3">
                 <Button 
                   type="submit" 
                   size="icon" 
                   disabled={!input.trim() || isLoading}
                   className="h-8 w-8 rounded-lg shadow-sm transition-all bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                 >
                    <Send className="h-4 w-4" />
                 </Button>
              </div>
            </form>
            <div className="text-center mt-2 pb-1">
              <span className="text-[11px] text-muted-foreground/70 tracking-wide font-medium">
                AI can make mistakes. Check the provided page sources.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
