<div align="center">
  <h1>🧠 Intelligent Document Hub (Enterprise RAG System)</h1>
  <p>A high-end, production-ready AI SaaS for document management, semantic search, and contextual chat.</p>

  [![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
</div>

---

## 🚀 Overview

The Intelligent Document Hub is an advanced Retrieval-Augmented Generation (RAG) platform built for precision and scale. This isn't just a standard chat wrapper; it's a deeply integrated cognitive tool designed for legal, medical, and professional grade accuracy. 

It allows users to securely upload PDF documents, intelligently extracts and chunks the text using LangChain, generates contextual embeddings via Google Gemini, and persists the vectors into Supabase holding the HNSW index metadata. A premium "Claude-style" split-view chat interface leverages Vercel's AI SDK to stream lightning-fast, highly accurate answers heavily citing their sourced document pages.

The platform also includes a complete SaaS monetization tier mapping Stripe webhook events to precise internal Subscription policies, unlocking limitless potential for "Pro" users and capping document upload abuse on the "Free" tier through Next.js secure Edge Middleware.

## 🏗️ The RAG Architecture (Why it's Enterprise-ready)

1. **PDF -> Distributed Loading:** Documents are uploaded securely to Supabase Storage. The URL is then fed into LangChain's `WebPDFLoader` extracting raw text while intrinsically maintaining the exact context window of which `pageNumber` each block of text belongs to.
2. **Intelligent Chunking:** `RecursiveCharacterTextSplitter` optimally breaks up pages into logical, overlapping contexts enabling pure semantic mapping.
3. **Embeddings:** Vector embedding processes synchronously pass chunks into Google's Gemini `text-embedding-004` API to generate a `768` dimension matrix per segment.
4. **Vector Database:** Natively leverages Postgres `pgvector` inside Supabase to securely save and map chunk matrices natively onto user IDs ensuring data tenant isolation and security.
5. **Gemini Retrieval Context:** User's queries perform an HNSW vector cosine search to match embeddings, feed the context securely into the `gemini-1.5-pro` logic, and stream verified data back accurately annotated with page locations.

## ✨ Core Features

- **Semantic RAG Engine:** Built-in PDF extraction and LangChain page-by-page Chunking.
- **Gemini Embeddings:** Generating robust vectors rapidly into an intelligently indexed pgvector cluster.
- **Claude-style Split UI:** A beautiful dual-pane view integrating an `iframe` and the Chat Assistant built alongside `shadcn/ui` variants.
- **AI Streaming Responses:** Vercel AI SDK seamlessly pumping highly accurate Markdown answers.
- **Fully Monetized System:** Guarded Endpoints (Middleware), Beautiful Tiered checkout interfaces tracking `$19/mo` Subscriptions asynchronously via Stripe Webhooks natively attached to User sessions.

## 🛠️ Deployment Checklist (Vercel & Supabase)

To get this powerful platform running on Production cleanly, follow these exact steps:

### 1. Supabase Initialization
- Sign up and spin up a new Supabase Project.
- Open **SQL Editor** -> Execute `supabase_schema.sql` and `supabase_schema_stripe.sql` to instantiate the Postgres pgvector tables and Stripe mapping limits.
- Go to **Storage** -> Create a public bucket simply named `documents`.
- Go to **Project Settings** -> **API** and copy your `Project URL`, `anon public` key, and crucially your `service_role` secret key.

### 2. Provider Endpoints
- Get your Gemini API Key from **Google AI Studio**.
- Setup your Stripe Subscriptions and get your **Stripe Secret**, **Pro Price ID**, and create a localized **Webhook Secret**.

### 3. Vercel Deployment
- Import your Github Repository into Vercel.
- Within the **Environment Variables** configuration step, map all the keys listed in `.env.example`.
- **CRITICAL:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is added to Vercel exactly as exported by Supabase. This key bypasses Row Level Security (RLS) entirely, enabling the Next.js Server Actions to securely embed and vectorize data within the database without exposing the powerful permissions to the client UI.
- Deploy! Vercel's Edge architecture will naturally configure `vercel.json` overriding serverless timeouts (set to 60s) preventing AI processing limits from timing out.

## 📝 License
This project is licensed under the [MIT License](LICENSE). 
Copyright © 2026 Ahmed ELBASHIER. All Rights Reserved.
