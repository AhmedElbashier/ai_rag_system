<div align="center">
  <h1>🧠 DocuMind — AI Document Hub</h1>
  <p>A high-end, production-ready RAG SaaS for document management, semantic search, and contextual AI chat.</p>

  [![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
</div>

---

## Overview

DocuMind is an advanced Retrieval-Augmented Generation (RAG) platform built for precision and scale. Upload PDF documents, extract and chunk text with LangChain, generate embeddings with Google Gemini, and store vectors in Supabase pgvector. A dark-themed split-view chat interface streams accurate answers with page citations.

The platform includes a complete SaaS monetization layer with Stripe webhooks, subscription-tier enforcement in Next.js middleware, and a full document management library.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | Tailwind CSS v4, Framer Motion, shadcn/ui, OKLCH colors |
| AI Embeddings | Google Gemini `gemini-embedding-001` (768-dim) via `@google/genai` |
| AI Chat | Google Gemini `gemini-2.5-flash-8b` via Vercel AI SDK |
| Chat Hook | `@ai-sdk/react` `useChat` (AI SDK v6+) |
| Vector DB | Supabase pgvector with HNSW index (cosine similarity) |
| File Storage | Supabase Storage (auto-created public bucket) |
| PDF Parsing | LangChain `WebPDFLoader` + `pdf-parse@1` |
| Text Chunking | LangChain `RecursiveCharacterTextSplitter` (1000 chars / 200 overlap) |
| Payments | Stripe Checkout + Webhooks |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Upload hub + live document library + Recent Insights
│   ├── actions.ts                # Server actions: processPDF, fetchDocuments, deleteDocument
│   ├── layout.tsx                # Root layout + Sonner toaster
│   ├── globals.css               # Tailwind v4 + OKLCH design tokens (dark mode)
│   ├── hub/[id]/
│   │   ├── page.tsx              # Document chat page (server component)
│   │   └── ChatWorkspace.tsx     # Split-screen: PDF iframe + Gemini chat (client)
│   ├── documents/page.tsx        # Full document library grid (server)
│   ├── chat/page.tsx             # Document picker → chat workspace (server)
│   ├── api-reference/page.tsx    # REST API documentation (mock)
│   ├── settings/page.tsx         # Settings: Profile, API Keys, Storage, Security (mock)
│   ├── pricing/page.tsx          # Stripe subscription tiers
│   └── api/
│       ├── chat/route.ts         # Streaming RAG chat endpoint
│       └── stripe/               # Stripe webhook + checkout handlers
├── components/
│   ├── TopNav.tsx                # Shared navigation bar (active-route aware)
│   └── ui/                       # shadcn/ui primitives
├── lib/
│   └── supabase.ts               # Supabase anon client + service-role admin client
└── middleware.ts                  # Route guard (protects /api/* except Stripe webhook)
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Upload zone + live document library + Recent Insights panel |
| `/documents` | Full document grid with status badges, word count, timestamps |
| `/chat` | Document picker list — click to open chat workspace |
| `/hub/[id]` | Split-screen: PDF viewer (left, 60%) + Gemini AI chat (right, 40%) |
| `/api-reference` | Mock REST API docs with expandable endpoints and copy-able curl examples |
| `/settings` | Mock settings: Profile, API Keys, Storage usage bar, Security toggles, Notifications |
| `/pricing` | Stripe-powered Free vs Pro subscription page |

---

## Database Schema

Run `supabase_schema.sql` in the Supabase SQL Editor before first use.

```sql
-- Required extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Source documents
CREATE TABLE documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Vector chunks
CREATE TABLE embeddings (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id  UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  content      TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',    -- { loc: { pageNumber: N } }
  embedding    VECTOR(768) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- HNSW index for fast cosine similarity search
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);
```

Also run `supabase_schema_stripe.sql` if using the Stripe monetization layer.

---

## Environment Variables

Create `.env.local` from `.env.template`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...

# Stripe (optional — required for /pricing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It is used only in server-side actions and API routes — never exposed to the client.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-time Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Enable the `vector` extension: **Database → Extensions → vector**
3. Run `supabase_schema.sql` in the **SQL Editor**
4. Copy your project URL and keys into `.env.local`
5. The `documents` storage bucket is **created automatically** on first PDF upload

---

## RAG Pipeline

```
PDF Upload
  │
  ├─ 1. Auto-create storage bucket if missing (supabaseAdmin)
  ├─ 2. Upload file → Supabase Storage → get public URL
  ├─ 3. Parse pages → LangChain WebPDFLoader (page-level metadata)
  ├─ 4. Chunk text → RecursiveCharacterTextSplitter (1000 chars / 200 overlap)
  ├─ 5. Embed chunks → Gemini gemini-embedding-001 (768-dim vectors)
  └─ 6. Store vectors → Supabase pgvector embeddings table

Chat Query
  │
  ├─ 1. Embed user question → Gemini gemini-embedding-001
  ├─ 2. Cosine similarity search → match_embeddings() RPC (top 5 chunks)
  ├─ 3. Filter chunks by documentId, build context with page citations
  └─ 4. Stream response → Gemini gemini-2.5-flash-8b (page-cited Markdown)
```

---

## Chat Page Navigation

The `/hub/[id]` split-screen chat extracts `Page N` citations from AI responses and renders them as clickable chips. Clicking a chip updates the PDF iframe URL to `#page=N`, jumping the viewer to the referenced page. The viewer also auto-jumps on each new AI response.

---

## Important Implementation Notes

- **Embedding model**: `text-embedding-004` is not available on this API key; `gemini-embedding-001` is used instead (same 768-dim output — no schema change required)
- **AI SDK v6**: `useChat` moved from `ai/react` to `@ai-sdk/react` — install `@ai-sdk/react` separately
- **pdf-parse version**: `WebPDFLoader` requires `pdf-parse@^1` (not v2)
- **Server components**: Pages using Supabase data are server components; hover effects use CSS classes, not JS event handlers
- **Middleware**: All app pages (`/`, `/documents`, `/chat`, `/hub/*`, `/api-reference`, `/settings`) are public. Only raw `/api/*` routes require authentication (Stripe webhook is exempted)

---

## Deployment (Vercel)

1. Import repo into Vercel
2. Add all environment variables from `.env.template`
3. Deploy — `vercel.json` sets a 60s function timeout to accommodate AI embedding time

---

## License

MIT License — Copyright © 2026 Ahmed ELBASHIER. All Rights Reserved.
