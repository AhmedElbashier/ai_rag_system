-- Enable the core pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for documents (the source PDFs)
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a table for RAG embeddings (chunks from the documents)
CREATE TABLE embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- e.g., {"loc": {"pageNumber": 1}}
  embedding VECTOR(3072) NOT NULL, -- 3072 is the format for Gemini models like gemini-embedding-001
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create HNSW index for fast nearest-neighbor search
CREATE INDEX on embeddings USING hnsw (embedding vector_cosine_ops);

-- Optional: Create a function for similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding VECTOR(3072),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  file_name TEXT,
  file_url TEXT,
  similarity FLOAT
)
LANGUAGE sql
AS $$
  SELECT
    embeddings.id,
    embeddings.document_id,
    embeddings.content,
    embeddings.metadata,
    documents.file_name,
    documents.file_url,
    1 - (embeddings.embedding <=> query_embedding) AS similarity
  FROM embeddings
  JOIN documents ON documents.id = embeddings.document_id
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;
