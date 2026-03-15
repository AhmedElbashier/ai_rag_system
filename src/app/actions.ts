"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processPDFAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file uploaded");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    // 1. Upload file to Supabase Storage
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents") // MUST create this bucket in Supabase Dashboard
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

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    // 5. Store embeddings in vector DB
    for (const chunk of chunks) {
      // Get embedding from Gemini
      const result = await model.embedContent(chunk.pageContent);
      const embedding = result.embedding.values; 

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
