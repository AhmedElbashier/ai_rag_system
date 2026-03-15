"use client";

import TopNav from "@/components/TopNav";
import { useState } from "react";
import { Copy, Check, Zap, Lock, Database, ChevronDown, ChevronRight } from "lucide-react";

const endpoints = [
  {
    method: "POST",
    path: "/api/documents/upload",
    description: "Upload and vectorize a PDF document.",
    badge: "Documents",
    request: `curl -X POST https://api.documind.ai/v1/documents/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf"`,
    response: `{
  "success": true,
  "document_id": "doc_a1b2c3d4",
  "file_name": "report.pdf",
  "chunks_created": 42,
  "created_at": "2026-03-15T10:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/documents",
    description: "List all indexed documents in your workspace.",
    badge: "Documents",
    request: `curl https://api.documind.ai/v1/documents \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "documents": [
    {
      "id": "doc_a1b2c3d4",
      "file_name": "report.pdf",
      "word_count": 4200,
      "created_at": "2026-03-15T10:00:00Z"
    }
  ],
  "total": 1
}`,
  },
  {
    method: "POST",
    path: "/api/chat",
    description: "Ask a question against an indexed document using semantic search + Gemini.",
    badge: "Chat",
    request: `curl -X POST https://api.documind.ai/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "document_id": "doc_a1b2c3d4",
    "message": "What is the main conclusion?"
  }'`,
    response: `{
  "answer": "The main conclusion is that...",
  "citations": [
    { "page": 3, "excerpt": "Our findings indicate..." }
  ],
  "model": "gemini-1.5-pro",
  "tokens_used": 512
}`,
  },
  {
    method: "POST",
    path: "/api/embeddings",
    description: "Generate a 768-dim embedding vector for any text string.",
    badge: "Embeddings",
    request: `curl -X POST https://api.documind.ai/v1/embeddings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "text": "sample input text" }'`,
    response: `{
  "embedding": [0.023, -0.145, 0.312, ...],
  "dimensions": 768,
  "model": "gemini-embedding-001"
}`,
  },
];

const methodColor: Record<string, string> = {
  GET:    "oklch(0.72 0.15 230)",
  POST:   "oklch(0.72 0.18 160)",
  DELETE: "oklch(0.70 0.22 30)",
  PATCH:  "oklch(0.78 0.18 60)",
};
const methodBg: Record<string, string> = {
  GET:    "oklch(0.50 0.12 230 / 0.15)",
  POST:   "oklch(0.55 0.18 160 / 0.15)",
  DELETE: "oklch(0.55 0.22 30 / 0.15)",
  PATCH:  "oklch(0.60 0.18 60 / 0.15)",
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative rounded-lg overflow-hidden" style={{ background: "oklch(0.09 0 0)" }}>
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-md transition-colors"
        style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.08)" }}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-[oklch(0.72_0.18_160)]" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
      </button>
      <pre className="p-4 text-xs text-white/70 overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({ ep }: { ep: typeof endpoints[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: "oklch(0.14 0.005 240 / 0.55)", border: "1px solid oklch(1 0 0 / 0.07)" }}
    >
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono"
          style={{ background: methodBg[ep.method], color: methodColor[ep.method] }}
        >
          {ep.method}
        </span>
        <span className="flex-1 font-mono text-sm text-white/80">{ep.path}</span>
        <span
          className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ background: "oklch(1 0 0 / 0.05)", color: "oklch(0.55 0 0)", border: "1px solid oklch(1 0 0 / 0.07)" }}
        >
          {ep.badge}
        </span>
        {open
          ? <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06]">
          <p className="text-sm text-white/45 pt-4">{ep.description}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Request</p>
              <CodeBlock code={ep.request} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Response</p>
              <CodeBlock code={ep.response} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiReferencePage() {
  const features = [
    { icon: Zap,      label: "Low latency",         sub: "~150ms median response" },
    { icon: Lock,     label: "API key auth",         sub: "Bearer token per request" },
    { icon: Database, label: "pgvector backend",     sub: "Cosine similarity search" },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] text-white dark flex flex-col">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[oklch(0.10_0_0)]" />
        <div className="absolute -top-32 right-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.50_0.10_250/0.06)] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.70 0 0 / 0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <TopNav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-14 space-y-14">

        {/* Header */}
        <div className="space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "oklch(0.50 0.10 250 / 0.12)",
              border: "1px solid oklch(0.60 0.10 250 / 0.25)",
              color: "oklch(0.72 0.10 250)",
            }}
          >
            API v1 · Beta
          </div>
          <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
          <p className="text-white/40 text-base max-w-xl">
            Integrate DocuMind into your product. Authenticate with your API key and start querying documents programmatically.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 pt-2">
            {features.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "oklch(0.14 0.005 240 / 0.55)", border: "1px solid oklch(1 0 0 / 0.07)" }}
              >
                <Icon className="w-4 h-4 text-[oklch(0.65_0.18_160)]" />
                <div>
                  <p className="text-xs font-medium text-white/80">{label}</p>
                  <p className="text-[11px] text-white/35">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white/80">Authentication</h2>
          <CodeBlock code={`Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxx`} />
          <p className="text-sm text-white/35">
            Pass your API key as a Bearer token in the Authorization header on every request.
            Keys can be managed in <span className="text-white/50">Settings → API Keys</span>.
          </p>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white/80">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <EndpointCard key={ep.path} ep={ep} />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
