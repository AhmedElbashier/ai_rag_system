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
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "@/components/TopNav";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const router      = useRouter();
  const isMobile    = useIsMobile();
  const [isHovering, setIsHovering]     = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]         = useState(0);
  const [scanStep, setScanStep]         = useState(0);
  const [docs, setDocs]                 = useState<Doc[]>([]);
  const [docsLoading, setDocsLoading]   = useState(true);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ── Cancel: clears the UI immediately (server action can't be stopped, but UX resets) ──
  const handleCancel = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setIsProcessing(false);
    setProgress(0);
    setScanStep(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Upload cancelled");
  }, []);

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

      progressInterval.current = setInterval(() => {
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

      if (progressInterval.current) clearInterval(progressInterval.current);
      setProgress(100);

      if (result.success && result.documentId) {
        toast.success("Document embedded successfully!", {
          description: "Your PDF is now in the intelligence base.",
        });
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
    { icon: Database, label: "pgvector Storage" },
  ];

  // ── Processing UI (shared between inline card and mobile overlay) ──
  const ProcessingContent = () => (
    <>
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
          className="text-sm font-medium text-[oklch(0.75_0.18_160)] text-center px-4">
          {scanSteps[scanStep]}
        </motion.p>
      </AnimatePresence>
      <div className="w-full max-w-xs space-y-2 px-4">
        <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-white/[0.06]">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, oklch(0.60 0.18 160), oklch(0.78 0.16 168))",
              boxShadow: "0 0 12px oklch(0.65 0.18 160 / 0.70)",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {/* Shimmer */}
          <motion.div
            className="absolute top-0 h-full w-8 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.4), transparent)" }}
            animate={{ left: ["-8%", "108%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/30">
          <span>Vectorizing document</span>
          <span className="font-mono font-medium text-white/50">{Math.min(progress, 100)}%</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-[oklch(0.10_0_0)] text-white flex flex-col dark">

      {/* ── Background — blur layers hidden on mobile for performance ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[oklch(0.10_0_0)]" />
        {/* Heavy blur gradients: desktop only */}
        <div className="hidden md:block absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[oklch(0.55_0.18_160/0.07)] blur-[120px]" />
        <div className="hidden md:block absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[oklch(0.40_0.06_240/0.06)] blur-[100px]" />
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[oklch(0.50_0.14_160/0.04)] blur-[140px]" />
        {/* Dot grid: lighter on mobile */}
        <div
          className="absolute inset-0 opacity-[0.12] md:opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.70 0 0 / 0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Mobile Full-Screen Processing Overlay ── */}
      <AnimatePresence>
        {isProcessing && isMobile && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 px-8"
            style={{ background: "oklch(0.10 0 0 / 0.97)", backdropFilter: "blur(16px)" }}
          >
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[oklch(0.55_0.18_160/0.10)] blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-6 w-full">
              <p className="text-base font-semibold text-white/60 tracking-wide">Processing Document</p>
              <ProcessingContent />
              {/* Cancel button — large thumb target */}
              <button
                onClick={handleCancel}
                className="mt-4 flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-white/60 active:scale-[0.97] transition-all"
                style={{ background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.10)" }}
              >
                <X className="w-4 h-4" />
                Cancel Upload
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TopNav />

      {/* pb-28 on mobile to clear fixed bottom CTA */}
      <main className="flex-1 flex flex-col items-center px-4 md:px-6 py-8 md:py-16 gap-12 md:gap-20 pb-28 md:pb-16">

        {/* ── Upload Hero ── */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-8 md:gap-12">

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[oklch(0.65_0.18_160/0.25)] bg-[oklch(0.55_0.18_160/0.08)] text-[oklch(0.75_0.18_160)] text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Powered by Gemini AI &amp; pgvector
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-white">
              Transform Documents
              <br />
              <span className="bg-gradient-to-r from-[oklch(0.75_0.18_160)] via-[oklch(0.80_0.14_170)] to-[oklch(0.70_0.16_155)] bg-clip-text text-transparent">
                into Intelligence
              </span>
            </h1>
            <p className="text-white/50 text-base md:text-lg leading-relaxed max-w-lg mx-auto">
              Upload technical manuals, legal contracts, or medical reports.
              Let Gemini AI index and architect your data.
            </p>
          </motion.div>

          {/* ── Upload Zone (desktop/tablet — hidden on mobile while processing) ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
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
                {/* Idle state */}
                {!isProcessing && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-5 py-10 md:py-16 px-8 text-center"
                  >
                    <motion.div
                      animate={isHovering ? { y: [-2, 2, -2], scale: 1.08 } : { y: 0, scale: 1 }}
                      transition={{ duration: 0.7, repeat: isHovering ? Infinity : 0, ease: "easeInOut" }}
                    >
                      <div
                        className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl transition-all duration-300"
                        style={{
                          background: isHovering ? "oklch(0.55 0.18 160 / 0.18)" : "oklch(1 0 0 / 0.05)",
                          border: isHovering ? "1px solid oklch(0.65 0.18 160 / 0.40)" : "1px solid oklch(1 0 0 / 0.10)",
                          boxShadow: isHovering ? "0 0 24px oklch(0.65 0.18 160 / 0.25)" : "none",
                        }}
                      >
                        <UploadCloud className="w-7 h-7 md:w-8 md:h-8 transition-colors duration-300"
                          style={{ color: isHovering ? "oklch(0.75 0.18 160)" : "oklch(0.60 0 0)" }} />
                      </div>
                    </motion.div>
                    <div className="space-y-1">
                      <p className="font-semibold text-white/90 text-sm md:text-base">
                        {isHovering ? "Release to upload" : "Drop your PDF here, or tap to browse"}
                      </p>
                      <p className="text-xs md:text-sm text-white/35">PDF files only · Up to 50MB</p>
                    </div>
                    {/* Drag hint — desktop only */}
                    <div className="hidden md:flex items-center gap-2 text-xs text-white/25">
                      <span>Drag &amp; drop</span><span>·</span><span>Click to select</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                )}

                {/* Desktop processing state (mobile uses full-screen overlay instead) */}
                {isProcessing && !isMobile && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-7 py-16 px-8"
                  >
                    <ProcessingContent />
                    {/* Cancel on desktop */}
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mt-1"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </motion.div>
                )}

                {/* Mobile placeholder while overlay is shown */}
                {isProcessing && isMobile && (
                  <motion.div key="mobile-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-3 py-10 px-8 text-white/30 text-sm"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-2 md:gap-3"
          >
            {badges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-3.5 py-1.5 md:py-2 rounded-full text-xs font-medium text-white/50"
                style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 text-[oklch(0.65_0.18_160)]" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Intelligence Base Library ── */}
        <div className="w-full max-w-6xl">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <div className="space-y-0.5">
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-[oklch(0.65_0.18_160)]" />
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
              className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl"
              style={{ border: "1px dashed oklch(1 0 0 / 0.07)", background: "oklch(1 0 0 / 0.02)" }}
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
                <Database className="w-6 h-6 text-white/20" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-white/50 font-medium">No intelligence indexed yet.</p>
                <p className="text-xs text-white/25">Upload a PDF above to get started.</p>
              </div>
            </motion.div>
          )}

          {/* Document grid + Recent Insights side-panel */}
          {!docsLoading && docs.length > 0 && (
            <div className="flex gap-6 items-start">

              {/* Grid: single-col on mobile, 2-col on sm, 3-col on lg */}
              <motion.div layout className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <AnimatePresence>
                  {docs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.93, y: -6 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div
                        className="group relative flex flex-col gap-3 md:gap-4 p-4 md:p-5 rounded-xl h-full transition-all duration-200 active:scale-[0.99]"
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
                          <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg shrink-0"
                            style={{ background: "oklch(0.55 0.18 160 / 0.12)", border: "1px solid oklch(0.65 0.18 160 / 0.20)" }}>
                            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-[oklch(0.72_0.18_160)]" />
                          </div>
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

                        {/* Name & meta */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white/85 truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/30">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{timeAgo(doc.created_at)}</span>
                            <span>·</span>
                            <span>{doc.word_count.toLocaleString()} words</span>
                          </div>
                        </div>

                        {/* Actions — taller on mobile for thumb friendliness */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.05]">
                          <Link href={`/hub/${doc.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 md:py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98]"
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
                            className="flex items-center justify-center w-9 h-9 md:w-8 md:h-8 rounded-lg transition-all active:scale-[0.95]"
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

              {/* Recent Insights — desktop/large tablet only */}
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

                {docs.slice(0, 3).map((doc) => (
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
                  <p className="text-[10px] text-white/20 text-center">Click any document to start a conversation</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile Fixed Bottom Upload CTA (thumb-zone) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 border-t border-white/[0.06]"
        style={{ background: "oklch(0.10 0 0 / 0.95)", backdropFilter: "blur(20px)" }}>
        <button
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: isProcessing
              ? "oklch(0.55 0.18 160 / 0.10)"
              : "oklch(0.55 0.18 160 / 0.85)",
            border: "1px solid oklch(0.65 0.18 160 / 0.40)",
            color: isProcessing ? "oklch(0.72 0.18 160)" : "white",
            boxShadow: isProcessing ? "none" : "0 0 20px oklch(0.65 0.18 160 / 0.30)",
          }}
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing PDF…</>
          ) : (
            <><UploadCloud className="w-4 h-4" /> Upload PDF</>
          )}
        </button>
      </div>
    </div>
  );
}
