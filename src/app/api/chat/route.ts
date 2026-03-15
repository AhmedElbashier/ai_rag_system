import { google } from '@ai-sdk/google';
import { embed, streamText } from 'ai';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { messages, documentId } = await req.json();

    if (!documentId) {
      return new Response("documentId is required", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    // 1. Generate an embedding for the user's query using AI SDK
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: query,
    });

    // 2. Perform Similarity Search in Supabase using the query embedding
    const { data: matchedChunks, error: matchError } = await supabaseAdmin
      .rpc('match_embeddings', {
        query_embedding: embedding,
        match_count: 5 // get top 5 context chunks
      });

    if (matchError) {
      console.error("Vector Search Error:", matchError);
      return new Response("Error querying the document.", { status: 500 });
    }

    // Filter chunks specifically for this document
    const documentChunks = (matchedChunks || []).filter(
      (chunk: any) => chunk.document_id === documentId
    );

    // 3. Build the prompt context based on retrieved blocks
    const sources = documentChunks.map((chunk: any) => {
      const pageNum = chunk.metadata?.loc?.pageNumber || "?";
      return `[Page ${pageNum}]: ${chunk.content}`;
    });

    const contextText = sources.join("\n\n");

    const systemPrompt = `You are a highly intelligent semantic document assistant. 
You are strictly assisting a user with questions regarding their provided PDF file.
Here is the retrieved context from the PDF document:

<context>
${contextText}
</context>

Always answer the user's question accurately using ONLY the information in the provided context above. 
Crucially: IMPORTANT: You must cite the page numbers in your response when referencing facts! 
For example, "According to the document (Page 4), the main cause is..." 
If the answer is not in the context, graciously tell the user that the document doesn't contain that information.`;

    // 4. Stream response back to the client using streamText
    const response = await streamText({
      model: google('gemini-2.5-flash-8b'), // Adjusted for accurate vercel AI SDK model naming
      system: systemPrompt,
      messages: messages,
    });

    return response.toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}
