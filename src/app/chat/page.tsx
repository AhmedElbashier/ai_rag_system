import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { FileText, MessageSquare, Clock, ArrowRight, Inbox } from "lucide-react";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

interface Document {
  id: string;
  file_name: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default async function ChatPage() {
  const { data: documents } = await supabaseAdmin
    .from("documents")
    .select("id, file_name, created_at")
    .order("created_at", { ascending: false });

  const docs: Document[] = documents ?? [];

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] text-white dark flex flex-col">
      <style>{`
        .chat-row { transition: border-color 0.2s, background 0.2s; }
        .chat-row:hover { border-color: oklch(0.65 0.18 160 / 0.25) !important; background: oklch(0.17 0.008 180 / 0.55) !important; }
        .chat-row:hover .chat-row-cta { color: oklch(0.65 0.18 160); }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[oklch(0.10_0_0)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[oklch(0.50_0.14_160/0.05)] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: "radial-gradient(circle, oklch(0.70 0 0 / 0.6) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
      </div>

      <TopNav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14">
        <div className="mb-10 space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Chat</h1>
          <p className="text-sm text-white/40">Select a document to start an AI-powered conversation.</p>
        </div>

        {docs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
              <Inbox className="w-6 h-6 text-white/25" />
            </div>
            <div>
              <p className="text-white/60 font-medium">No documents to chat with</p>
              <p className="text-white/30 text-sm mt-1">Upload a PDF first to start chatting</p>
            </div>
            <Link href="/"
              className="mt-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "oklch(0.55 0.18 160 / 0.18)", border: "1px solid oklch(0.65 0.18 160 / 0.30)" }}>
              Upload a document
            </Link>
          </div>
        )}

        {docs.length > 0 && (
          <div className="flex flex-col gap-2">
            {docs.map((doc) => (
              <Link key={doc.id} href={`/hub/${doc.id}`}
                className="chat-row flex items-center gap-4 px-5 py-4 rounded-xl"
                style={{ background: "oklch(0.14 0.005 240 / 0.55)", border: "1px solid oklch(1 0 0 / 0.07)", backdropFilter: "blur(12px)" }}
              >
                <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ background: "oklch(0.55 0.18 160 / 0.12)", border: "1px solid oklch(0.65 0.18 160 / 0.20)" }}>
                  <FileText className="w-4 h-4 text-[oklch(0.72_0.18_160)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/85 truncate">{doc.file_name}</p>
                  <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />{timeAgo(doc.created_at)}
                  </p>
                </div>
                <div className="chat-row-cta shrink-0 flex items-center gap-1.5 text-xs font-medium text-white/25 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
