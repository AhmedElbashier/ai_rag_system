"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { processPDFAction } from "./actions";
import { toast } from "sonner";
import { UploadCloud, FileType, Loader2, CheckCircle, BrainCircuit, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function DocumentHubPage() {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Format not supported", {
        description: "Please upload a PDF file.",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10); // Start processing

      // Simulate step-by-step progress for better UI feel
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 800);

      const formData = new FormData();
      formData.append("file", file);

      const result = await processPDFAction(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.documentId) {
        toast.success("Document Embedded Successfully!", {
          description: "Navigating to your Intelligent Chat workspace...",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
        
        setTimeout(() => {
           router.push(`/hub/${result.documentId}`);
        }, 800);
      } else {
        toast.error("Processing Failed", {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error("Error Processing PDF", {
        description: "An unexpected error occurred. Check the console.",
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 dark">
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />

      <div className="max-w-3xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
              <BrainCircuit className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Intelligent Document Hub
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium">
            Upload your PDFs, generate smart embeddings, and unlock semantic search.
          </p>
        </div>

        <Card className="border border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="h-6 w-6 text-primary" />
              Upload to Supabase Vector
            </CardTitle>
            <CardDescription className="text-base">
              Drag and drop your PDF here or click to select a file. We will extract the text and generate embeddings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsHovering(true);
              }}
              onDragLeave={() => setIsHovering(false)}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center w-full h-80 rounded-2xl border-3 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                ${isHovering ? "border-primary bg-primary/10 scale-[1.02]" : "border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 hover:border-primary/50"}
                ${isProcessing ? "pointer-events-none opacity-80" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />

              {!isProcessing ? (
                <div className="flex flex-col items-center gap-4 text-center px-4">
                  <div className={`p-5 rounded-full bg-background/50 border shadow-sm transition-transform duration-500 ${isHovering ? "scale-110 shadow-primary/25" : ""}`}>
                    <UploadCloud className="w-12 h-12 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">Click or drag a PDF file here</p>
                    <p className="text-sm text-muted-foreground">Up to 50MB (Gemini Embeddings)</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 w-full max-w-md px-10">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileType className="w-6 h-6 text-foreground bg-background rounded-sm" />
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3 text-center">
                    <Progress value={progress} className="h-3 w-full bg-muted/50" />
                    <p className="font-medium text-primary animate-pulse">
                      {progress < 30 ? "Uploading to Supabase Storage..." : 
                       progress < 60 ? "Extracting Text from PDF..." : 
                       progress < 90 ? "Generating AI Embeddings..." : 
                       "Storing Vectors in Postgres..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full px-8 gap-2 bg-background/50 border-input hover:bg-muted"
                onClick={() => {
                  window.open("https://supabase.com", "_blank");
                }}
              >
                Go to Supabase Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
