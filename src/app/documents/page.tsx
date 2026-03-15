import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { FileText, MessageSquare, Clock, Plus, Inbox } from "lucide-react";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  content: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).length.toLocaleString();
}

export default async function DocumentsPage() {
  const { data: documents, error } = await supabaseAdmin
    .from("documents")
    .select("id, file_name, file_url, content, created_at")
    .order("created_at", { ascending: false });

  const docs: Document[] = documents ?? [];

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] text-white dark flex flex-col">
      <style>{`
        .doc-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .doc-card:hover { border-color: oklch(0.65 0.18 160 / 0.28) !important; box-shadow: 0 0 0 1px oklch(0.65 0.18 160 / 0.08); }
        .doc-card:hover .doc-chat-label { opacity: 1; }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[oklch(0.10_0_0)]" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[oklch(0.55_0.18_160/0.06)] blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[oklch(0.40_0.06_240/0.05)] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: "radial-gradient(circle, oklch(0.70 0 0 / 0.6) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
      </div>

      <TopNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">

        {/* Page header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Documents</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {docs.length} document{docs.length !== 1 ? "s" : ""} indexed
            </p>
          </div>
          <Link href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: "oklch(0.55 0.18 160 / 0.18)", border: "1px solid oklch(0.65 0.18 160 / 0.30)" }}
          >
            <Plus className="w-4 h-4" />
            Upload PDF
          </Link>
        </div>

        {/* Empty state */}
        {docs.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
              <Inbox className="w-6 h-6 text-white/25" />
            </div>
            <div>
              <p className="text-white/60 font-medium">No documents yet</p>
              <p className="text-white/30 text-sm mt-1">Upload a PDF to get started</p>
            </div>
            <Link href="/"
              className="mt-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "oklch(0.55 0.18 160 / 0.18)", border: "1px solid oklch(0.65 0.18 160 / 0.30)" }}>
              Upload your first document
            </Link>
          </div>
        )}

        {error && (
          <div className="py-16 text-center text-white/40 text-sm">
            Could not load documents. Check your Supabase connection.
          </div>
        )}

        {/* Document grid */}
        {docs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <Link key={doc.id} href={`/hub/${doc.id}`}
                className="doc-card group relative flex flex-col gap-4 p-5 rounded-xl"
                style={{
                  background: "oklch(0.16 0.005 240 / 0.50)",
                  border: "1px solid oklch(1 0 0 / 0.07)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* File icon + time */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{ background: "oklch(0.55 0.18 160 / 0.12)", border: "1px solid oklch(0.65 0.18 160 / 0.20)" }}>
                    <FileText className="w-5 h-5 text-[oklch(0.72_0.18_160)]" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.07)", color: "oklch(0.60 0 0)" }}>
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(doc.created_at)}
                  </span>
                </div>

                {/* Name & excerpt */}
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-sm text-white/90 truncate">{doc.file_name}</p>
                  <p className="text-xs text-white/35 line-clamp-2 leading-relaxed">
                    {doc.content.slice(0, 120).trim()}…
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-xs text-white/30">{wordCount(doc.content)} words</span>
                  <span className="doc-chat-label inline-flex items-center gap-1.5 text-xs font-medium text-[oklch(0.65_0.18_160)] opacity-0 transition-opacity">
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
