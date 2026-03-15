"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function processPDFAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file uploaded");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    // 1. Ensure storage bucket exists, then upload file
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "documents");
    if (!bucketExists) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket("documents", { public: true });
      if (bucketError) throw new Error(`Failed to create storage bucket: ${bucketError.message}`);
    }

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(uniqueFileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    // Get public URL of the uploaded file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("documents")
      .getPublicUrl(uploadData.path);
    const fileUrl = publicUrlData.publicUrl;

    // 2. Extract text from PDF by page using LangChain's WebPDFLoader
    const loader = new WebPDFLoader(file);
    const rawDocs = await loader.load(); // Returns an array of Document objects (one per page)
    
    // Combine all text for the Documents table, but we will chunk logically next
    const fullTextContext = rawDocs.map(doc => doc.pageContent).join("\n\n");

    if (!fullTextContext) {
      throw new Error("Could not extract any text from the PDF.");
    }

    // 3. Store document in Supabase
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .insert({
        file_name: file.name,
        file_url: fileUrl,
        content: fullTextContext,
      })
      .select("id")
      .single();

    if (docError || !document) {
      throw new Error(`Document DB insert error: ${docError?.message}`);
    }

    const documentId = document.id;

    // 4. Split and Chunk Text efficiently while retaining page metadata
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    // Split the docs (which already contain metadata.loc.pageNumber natively)
    const chunks = await splitter.splitDocuments(rawDocs);

    // 5. Store embeddings in vector DB
    for (const chunk of chunks) {
      // Get embedding from Gemini (using @google/genai which targets v1 API)
      const result = await genAI.models.embedContent({
        model: "gemini-embedding-001",
        contents: chunk.pageContent,
      });
      const embedding = result.embeddings?.[0]?.values;

      // Store in pgvector natively, ensuring we include page metadata (loc.pageNumber)
      const { error: embedError } = await supabaseAdmin
        .from("embeddings")
        .insert({
          document_id: documentId,
          content: chunk.pageContent,
          metadata: chunk.metadata, // Store the entire metadata object mapping to the page
          embedding: embedding,
        });

      if (embedError) {
        console.error("Error inserting embedding chunk:", embedError.message);
      }
    }

    return {
      success: true,
      message: "PDF beautifully processed and intelligently embedded!",
      documentId,
    };
  } catch (error: any) {
    console.error("Action error:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred during processing.",
    };
  }
}

export async function fetchDocumentsAction() {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id, file_name, file_url, created_at, content")
    .order("created_at", { ascending: false });
  if (error) return { documents: [], error: error.message };
  return {
    documents: (data ?? []).map((d) => ({
      id: d.id as string,
      file_name: d.file_name as string,
      file_url: d.file_url as string,
      created_at: d.created_at as string,
      word_count: (d.content as string).trim().split(/\s+/).length,
    })),
    error: null,
  };
}

export async function deleteDocumentAction(id: string) {
  // Delete embeddings (cascade should handle it, but be explicit)
  await supabaseAdmin.from("embeddings").delete().eq("document_id", id);

  // Delete storage file
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .single();

  if (doc?.file_url) {
    const url = new URL(doc.file_url);
    const storagePath = url.pathname.split("/object/public/documents/")[1];
    if (storagePath) {
      await supabaseAdmin.storage.from("documents").remove([decodeURIComponent(storagePath)]);
    }
  }

  const { error } = await supabaseAdmin.from("documents").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
