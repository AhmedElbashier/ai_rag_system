"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { processPDFAction, fetchDocumentsAction, deleteDocumentAction } from "./actions";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  Shield,
  Zap,
  Database,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Trash2,
  Clock,
  BookOpen,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "@/components/TopNav";
import Link from "next/link";

interface Doc {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  word_count: number;
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

export default function DocumentHubPage() {
  const router = useRouter();
  const [isHovering, setIsHovering]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]       = useState(0);
  const [scanStep, setScanStep]       = useState(0);
  const [docs, setDocs]               = useState<Doc[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanSteps = [
    "Uploading to Supabase Storage...",
    "Extracting text from PDF...",
    "Generating Gemini Embeddings...",
    "Storing vectors in pgvector...",
  ];

  const loadDocs = useCallback(async () => {
    const { documents } = await fetchDocumentsAction();
    setDocs(documents);
    setDocsLoading(false);
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Format not supported", { description: "Please upload a PDF file." });
      return;
    }
    try {
      setIsProcessing(true);
      setProgress(5);
      setScanStep(0);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 12;
          if (next >= 25 && prev < 25) setScanStep(1);
          if (next >= 55 && prev < 55) setScanStep(2);
          if (next >= 80 && prev < 80) setScanStep(3);
          return next < 90 ? next : prev;
        });
      }, 900);

      const formData = new FormData();
      formData.append("file", file);
      const result = await processPDFAction(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.documentId) {
        toast.success("Document embedded successfully!", {
          description: "Your PDF is now in the intelligence base.",
        });
        // Refresh library
        await loadDocs();
        setTimeout(() => router.push(`/hub/${result.documentId}`), 900);
      } else {
        toast.error("Processing Failed", { description: result.message });
        setIsProcessing(false);
        setProgress(0);
      }
    } catch {
      toast.error("Error Processing PDF");
      setIsProcessing(false);
      setProgress(0);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    const result = await deleteDocumentAction(id);
    if (result.success) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    } else {
      toast.error("Failed to delete document");
    }
    setDeletingId(null);
  };

  const badges = [
    { icon: Shield,   label: "End-to-End Encryption" },
    { icon: Zap,      label: "Gemini Vectorization" },
    { icon: Database, label: "Supabase pgvector Storage" },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] text-white flex flex-col dark">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[oklch(0.10_0_0)]" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[oklch(0.55_0.18_160/0.07)] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[oklch(0.40_0.06_240/0.06)] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[oklch(0.50_0.14_160/0.04)] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.70 0 0 / 0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <TopNav />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-20">

        {/* ── Upload Hero ── */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-12">

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[oklch(0.65_0.18_160/0.25)] bg-[oklch(0.55_0.18_160/0.08)] text-[oklch(0.75_0.18_160)] text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Powered by Gemini AI &amp; pgvector
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-white">
              Transform Documents
              <br />
              <span className="bg-gradient-to-r from-[oklch(0.75_0.18_160)] via-[oklch(0.80_0.14_170)] to-[oklch(0.70_0.16_155)] bg-clip-text text-transparent">
                into Intelligence
              </span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed max-w-lg mx-auto">
              Upload your technical manuals, legal contracts, or medical reports.
              Let Gemini AI index and architect your data.
            </p>
          </motion.div>

          {/* Upload zone */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
              onDragLeave={() => setIsHovering(false)}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className="relative w-full rounded-2xl cursor-pointer overflow-hidden transition-all duration-300"
              style={{
                background: "oklch(0.16 0.005 240 / 0.60)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: isHovering
                  ? "1.5px solid oklch(0.65 0.18 160 / 0.60)"
                  : "1.5px solid oklch(1 0 0 / 0.08)",
                boxShadow: isHovering
                  ? "0 0 0 4px oklch(0.65 0.18 160 / 0.08), 0 24px 60px oklch(0 0 0 / 0.40)"
                  : "0 8px 40px oklch(0 0 0 / 0.30)",
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />

              <AnimatePresence mode="wait">
                {!isProcessing ? (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-6 py-16 px-8 text-center"
                  >
                    <motion.div
                      animate={isHovering ? { y: [-2, 2, -2], scale: 1.08 } : { y: 0, scale: 1 }}
                      transition={{ duration: 0.7, repeat: isHovering ? Infinity : 0, ease: "easeInOut" }}
                    >
                      <div
                        className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300"
                        style={{
                          background: isHovering ? "oklch(0.55 0.18 160 / 0.18)" : "oklch(1 0 0 / 0.05)",
                          border: isHovering ? "1px solid oklch(0.65 0.18 160 / 0.40)" : "1px solid oklch(1 0 0 / 0.10)",
                          boxShadow: isHovering ? "0 0 24px oklch(0.65 0.18 160 / 0.25)" : "none",
                        }}
                      >
                        <UploadCloud className="w-8 h-8 transition-colors duration-300"
                          style={{ color: isHovering ? "oklch(0.75 0.18 160)" : "oklch(0.60 0 0)" }} />
                      </div>
                    </motion.div>
                    <div className="space-y-1.5">
                      <p className="font-semibold text-white/90 text-base">
                        {isHovering ? "Release to upload" : "Drop your PDF here, or click to browse"}
                      </p>
                      <p className="text-sm text-white/35">Supports PDF · Up to 50MB</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/25">
                      <span>Drag &amp; drop</span><span>·</span><span>Click to select</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-7 py-16 px-8"
                  >
                    <div className="relative flex items-center justify-center w-16 h-16">
                      <div className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: "oklch(0.65 0.18 160 / 0.12)" }} />
                      <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full"
                        style={{ background: "oklch(0.55 0.18 160 / 0.15)", border: "1px solid oklch(0.65 0.18 160 / 0.35)" }}>
                        <FileText className="w-6 h-6 text-[oklch(0.75_0.18_160)]" />
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p key={scanStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="text-sm font-medium text-[oklch(0.75_0.18_160)]">
                        {scanSteps[scanStep]}
                      </motion.p>
                    </AnimatePresence>
                    <div className="w-full max-w-xs space-y-2">
                      <div className="relative h-1 w-full rounded-full overflow-hidden bg-white/[0.06]">
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, oklch(0.60 0.18 160), oklch(0.78 0.16 168))",
                            boxShadow: "0 0 12px oklch(0.65 0.18 160 / 0.70)",
                          }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute top-0 h-full w-8 rounded-full"
                          style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.4), transparent)" }}
                          animate={{ left: ["-8%", "108%"] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/25">
                        <span>Vectorizing</span>
                        <span>{Math.min(progress, 100)}%</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {badges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium text-white/50"
                style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                <Icon className="w-3.5 h-3.5 text-[oklch(0.65_0.18_160)]" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Intelligence Base Library ── */}
        <div className="w-full max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[oklch(0.65_0.18_160)]" />
                Your Intelligence Base
              </h2>
              <p className="text-xs text-white/35">
                {docsLoading ? "Loading..." : `${docs.length} document${docs.length !== 1 ? "s" : ""} indexed`}
              </p>
            </div>
            {docs.length > 0 && (
              <Link href="/documents"
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors">
                View all <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Loading */}
          {docsLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!docsLoading && docs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
              style={{ border: "1px dashed oklch(1 0 0 / 0.07)", background: "oklch(1 0 0 / 0.02)" }}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl"
                style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
                <Database className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-sm text-white/40 font-medium">No intelligence indexed yet.</p>
              <p className="text-xs text-white/25">Upload a PDF above to start.</p>
            </motion.div>
          )}

          {/* Document grid + Recent Insights side-panel */}
          {!docsLoading && docs.length > 0 && (
            <div className="flex gap-6 items-start">

              {/* Grid */}
              <motion.div layout className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {docs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -8 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div
                        className="group relative flex flex-col gap-4 p-5 rounded-xl h-full transition-all duration-200"
                        style={{
                          background: "oklch(0.15 0.005 240 / 0.55)",
                          border: "1px solid oklch(1 0 0 / 0.08)",
                          backdropFilter: "blur(14px)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.65 0.18 160 / 0.28)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px oklch(0.65 0.18 160 / 0.07), 0 8px 32px oklch(0 0 0 / 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "oklch(1 0 0 / 0.08)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                            style={{ background: "oklch(0.55 0.18 160 / 0.12)", border: "1px solid oklch(0.65 0.18 160 / 0.20)" }}>
                            <FileText className="w-4 h-4 text-[oklch(0.72_0.18_160)]" />
                          </div>

                          {/* Status badge */}
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              background: "oklch(0.55 0.18 160 / 0.12)",
                              border: "1px solid oklch(0.65 0.18 160 / 0.25)",
                              color: "oklch(0.72 0.18 160)",
                              boxShadow: "0 0 8px oklch(0.65 0.18 160 / 0.20)",
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.18_160)] animate-pulse" />
                            Ready
                          </span>
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white/85 truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/30">
                            <Clock className="w-3 h-3" />
                            <span>{timeAgo(doc.created_at)}</span>
                            <span>·</span>
                            <span>{doc.word_count.toLocaleString()} words</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.05]">
                          <Link href={`/hub/${doc.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: "oklch(0.55 0.18 160 / 0.14)",
                              border: "1px solid oklch(0.65 0.18 160 / 0.25)",
                              color: "oklch(0.75 0.18 160)",
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chat with PDF
                          </Link>
                          <button
                            onClick={(e) => handleDelete(e, doc.id)}
                            disabled={deletingId === doc.id}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.07)" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "oklch(0.70 0.22 30 / 0.12)";
                              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.70 0.22 30 / 0.30)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "oklch(1 0 0 / 0.04)";
                              (e.currentTarget as HTMLElement).style.borderColor = "oklch(1 0 0 / 0.07)";
                            }}
                          >
                            {deletingId === doc.id
                              ? <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5 text-white/30" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* ── Recent Insights Panel ── */}
              <div
                className="hidden lg:flex flex-col gap-4 w-72 shrink-0 rounded-xl p-5"
                style={{
                  background: "oklch(0.14 0.005 240 / 0.50)",
                  border: "1px solid oklch(1 0 0 / 0.07)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[oklch(0.65_0.18_160)]" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Recent Insights</span>
                </div>

                {docs.slice(0, 3).map((doc, i) => (
                  <Link key={doc.id} href={`/hub/${doc.id}`}
                    className="group flex items-start gap-3 p-3 rounded-lg transition-colors"
                    style={{ background: "oklch(1 0 0 / 0.03)", border: "1px solid oklch(1 0 0 / 0.05)" }}
                  >
                    <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md mt-0.5"
                      style={{ background: "oklch(0.55 0.18 160 / 0.12)", border: "1px solid oklch(0.65 0.18 160 / 0.18)" }}>
                      <FileText className="w-3.5 h-3.5 text-[oklch(0.70_0.18_160)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/70 truncate group-hover:text-white transition-colors">
                        {doc.file_name}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(doc.created_at)}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors mt-0.5 shrink-0" />
                  </Link>
                ))}

                <div className="pt-2 border-t border-white/[0.05]">
                  <p className="text-[10px] text-white/20 text-center">
                    Click any document to start a conversation
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </main>
    </div>
  );
}
