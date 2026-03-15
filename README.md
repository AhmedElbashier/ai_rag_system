<div align="center">
  <h1>🧠 Intelligent Document Hub (RAG System)</h1>
  <p>A high-end, production-ready AI SaaS for document management, semantic search, and contextual chat.</p>

  [![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
</div>

---

## 🚀 Overview

The Intelligent Document Hub is an advanced Retrieval-Augmented Generation (RAG) platform. It allows users to securely upload PDF documents, intelligently extracts and chunks the text using LangChain, generates contextual embeddings via Google Gemini, and persists the vectors into Supabase holding the HNSW index metadata. A premium "Claude-style" split-view chat interface leverages Vercel's AI SDK to stream lightning-fast, highly accurate answers heavily citing their sourced document pages.

The platform also includes a complete SaaS monetization tier mapping Stripe webhook events to precise internal Subscription policies, unlocking limitless potential for "Pro" users and capping document upload abuse on the "Free" tier through Next.js secure Edge Middleware.

## ✨ Core Features

- **Semantic RAG Engine:** Built-in PDF extraction and LangChain page-by-page Chunking (`WebPDFLoader`).
- **Gemini Embeddings:** Generating robust vectors rapidly into an intelligently indexed pgvector cluster.
- **Claude-style Split UI:** A beautiful dual-pane view integrating an `iframe` and the Chat Assistant built alongside `shadcn/ui` variants.
- **AI Streaming Responses:** Vercel AI SDK seamlessly pumping highly accurate Markdown answers.
- **Page Referencing:** Source pages inherently stitched into prompts via LangChain logic and output gracefully to users validating AI claims.
- **Fully Monetized System:** Guarded Endpoints (Middleware), Beautiful Tiered checkout interfaces tracking `$19/mo` Subscriptions asynchronously via Stripe Webhooks natively attached to User sessions.

## 🏗️ Architecture Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Directory, API Routes, Turbopack, Server Actions)
- **Database & Vector Store**: [Supabase](https://supabase.com/) (Postgres + pgvector natively indexing 768d dimensions using HNSW)
- **Auth**: [Supabase SSR/Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- **AI/LLM**: [Google Gemini Models](https://deepmind.google/technologies/gemini/) (API keys safely secured in server routes + Vercel AI SDK wrappers)
- **Extraction Tools**: [LangChain.js](https://js.langchain.com/docs/get_started/introduction) + `pdf-parse`
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + Tailwind CSS + Framer/Lucide UI motifs
- **Payments**: [Stripe](https://stripe.com/docs/api) + Checkout Sessions + Webhook Lifecycles

## 🛠️ Setup Guide

Follow these steps to get your environment ready:

### 1. Clone the Repository
```bash
git clone https://github.com/AhmedElbashier/ai_rag_system.git
cd ai_rag_system
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to create your local variables setup:

```bash
cp .env.example .env.local
```
Fill out the variables accordingly.

### 3. Setup Supabase
1. Create a new Supabase Project.
2. In your Supabase SQL Editor, run the scripts placed in:
   - `supabase_schema.sql` (Creates documents, vectors, and search algorithm functions)
   - `supabase_schema_stripe.sql` (Setup subscriptions + limitations mapping)
3. Create a public Storage bucket named precisely `documents`.

### 4. Run the Development Server
Fire up Turbopack and explore the hub locally:
```bash
npm run dev
```

Visit `http://localhost:3000` to interact with the project. To test the Webhook system locally, ensure you have the [Stripe CLI](https://stripe.com/docs/cli) forwarding events to `/api/stripe/webhook`.

## 📝 License
This project is licensed under the [MIT License](LICENSE). 
Copyright © 2026 Ahmed ELBASHIER. All Rights Reserved.
