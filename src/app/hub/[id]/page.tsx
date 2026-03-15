import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ChatWorkspace from "./ChatWorkspace";

// Force dynamic since we look up DB via page params
export const dynamic = 'force-dynamic';

export default async function HubDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) return notFound();

  // Fetch document details from Supabase using Service Role
  const { data: document, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !document) {
    console.error("Document fetch error:", error);
    return notFound();
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <ChatWorkspace 
        documentId={document.id}
        documentUrl={document.file_url}
        documentName={document.file_name} 
      />
    </div>
  );
}
