# ScholarMesh AI — Multi-Source Research Synthesis & Evidence Discovery Platform

> **AI for Research & Knowledge Discovery Platform**  
> Architected for academic researchers, R&D labs, scientific analysts, and policy professionals to deconstruct fragmented literature, uncover empirical contradictions, map evidence matrices, and conduct citation-grounded corpus interrogation with **Google Gemini 2.5 Flash**.

---

## 1. Problem Statement & Mission

Researchers and scientific analysts spend up to **60% of their operational bandwidth** manually reading fragmented PDFs, laboratory notes, and preprint abstracts—struggling to:
1. **Cross-reference divergent findings** across small-sample vs. large-cohort studies.
2. **Detect subtle methodological discrepancies** (e.g., bolus IV injection vs. slow infusion, assay timing differences, model species variance).
3. **Trace atomic empirical claims** back to verbatim quotes with quantifiable statistical rigor.
4. **Synthesize contradictory evidence** into actionable decision recommendations.

**ScholarMesh AI** automates this workflow end-to-end:
- **Dedicated Workspaces:** Organize inquiries by domain, primary research question, and working hypothesis.
- **Multi-Modal Document Ingestion:** Upload `.pdf`, `.txt`, or `.md` files (parsed server-side via Multer memory buffers and `pdf-parse`) or paste raw abstracts and DOI notes.
- **Structured Knowledge Claim Extraction:** Automatically extracts atomic findings, statistical metrics, study designs, limitations, and confidence levels, paired with a calculated **Methodology Rigor Score (0–100)**.
- **Cross-Source Knowledge Synthesis Studio:** Simultaneously evaluates 2 or more studies under 4 analytical lenses to reveal consensus themes, direct contradictions, research gaps, and decision matrices.
- **Citation-Grounded Research Copilot:** Conversational AI grounded strictly in workspace claims with inline clickable citations `[Source: <Title>]` and follow-up inquiry suggestions.

---

## 2. System Architecture & Tech Stack

```mermaid
flowchart TD
    User([Researcher Client]) -->|Vite + React 18 + Tailwind| Frontend[ScholarMesh Web Application]
    Frontend -->|JWT Authorization: Bearer <token>| ExpressAPI[Node.js + Express REST API]
    
    subgraph Security & Ingestion Layer
        ExpressAPI --> Helmet[Helmet + CORS Security]
        ExpressAPI --> RateLimiter[Express Rate Limiter: General & AI Quotas]
        ExpressAPI --> Multer[Multer Memory Buffer Ingestion]
        Multer --> PDFParser[PDF-Parse + UTF-8 Text Decoder]
        ExpressAPI --> ZodValidator[Zod Request & Schema Validators]
    end

    subgraph Data & Storage Layer
        ExpressAPI --> PG[(PostgreSQL Pool / Resilient Fallback Engine)]
        PG --> UsersTable[(users)]
        PG --> WorkspacesTable[(workspaces)]
        PG --> SourcesTable[(sources)]
        PG --> ClaimsTable[(extracted_claims)]
        PG --> SynthesisTable[(synthesis_reports)]
        PG --> CopilotTable[(copilot_messages)]
    end

    subgraph AI Engine Layer
        ExpressAPI --> GeminiSDK["@google/genai SDK (gemini-2.5-flash)"]
        GeminiSDK --> ClaimExtractor["Single Source Claim Extraction & Rigor Scoring"]
        GeminiSDK --> SynthesisEngine["Multi-Document Cross-Source Synthesis"]
        GeminiSDK --> CopilotRAG["Citation-Grounded Copilot Q&A"]
    end
```

### Full Technology Stack
- **Frontend:** React 18+, Vite, React Router DOM v6+, Tailwind CSS (Slate-950 dark theme with Indigo-500 and Emerald-500 accents), Lucide React, Axios with request/response interceptors.
- **Backend:** Node.js, Express.js (REST API architecture), Zod validation schemas, Multer (10MB memoryStorage), `pdf-parse`.
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` password hashing (10 salt rounds).
- **Security:** `helmet`, `cors`, `express-rate-limit` (150 req/15min general, 30 req/15min AI routes).
- **Database:** PostgreSQL (compatible with Supabase, Neon, Railway, or local Postgres via `pg` connection pool) with automatic schema migration (`init.sql`) and built-in resilient persistent storage fallback.
- **Artificial Intelligence:** Official `@google/genai` SDK using `gemini-2.5-flash` with strict JSON schemas (`responseSchema` & `responseMimeType: "application/json"`).

---

## 3. Supported Research Domains & Analytical Lenses

### 6 Knowledge Domains
1. **Biomedical & Clinical Sciences (`biomedical_clinical`):** Pharmacokinetics, mRNA delivery, oncology, clinical trials, toxicological assays.
2. **AI, Systems & Computer Science (`ai_computer_science`):** Large language models, distributed systems, quantum computing, compiler optimization.
3. **Climate Science, Energy & Environmental Policy (`climate_sustainability`):** Grid decarbonization, solid-state batteries, carbon sequestration, IPCC modeling.
4. **Macroeconomics & Financial Markets (`economics_market`):** Monetary policy transmission, econometric modeling, liquidity crises, algorithmic trading.
5. **Legal Precedent, Compliance & Regulatory Analysis (`legal_regulatory`):** Antitrust jurisprudence, statutory interpretation, GDPR/AI Act compliance.
6. **Social Sciences, Psychology & Public Policy (`social_behavioral`):** Cognitive behavioral interventions, behavioral economics, public health adherence.

### 4 Synthesis Lenses (`synthesis_mode`)
- **Systematic Literature Review (`systematic_review`):** Comprehensive convergence of findings, statistical metrics, and methodology quality across cohorts.
- **Contradiction & Bias Audit (`contradiction_audit`):** Scrutinizes conflicting data points, sample biases, and opposing conclusions to isolate root causes.
- **Decision Brief & Recommendations (`decision_brief`):** Translates research evidence into executive policy/engineering actions with explicit risk ratings.
- **Unexplored Gap Analysis (`gap_analysis`):** Identifies untested variables, demographic blind spots, and future empirical hypotheses.

---

## 4. Quick Start & Local Setup

### Prerequisites
- Node.js 18+ (tested on Node.js v20.18.0)
- npm or pnpm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/scholarmesh-ai.git
cd scholarmesh-ai

# Install root, backend, and frontend packages
npm run install:all
```

### 2. Environment Variables Configuration

#### Backend Configuration (`server/.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scholarmesh_db
JWT_SECRET=scholarmesh_ultra_secure_jwt_secret_key_2026_scholar_mesh
GEMINI_API_KEY=your_google_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```
> **AI Key Isolation Note:** `GEMINI_API_KEY` is exclusively consumed by the Express backend (`server/src/services/geminiService.js`). It is never bundled, leaked, or referenced in the frontend client. When running offline or without an API key, ScholarMesh AI automatically activates a deterministic fallback parser that generates research-grade analyses directly from the ingested text.

#### Frontend Configuration (`client/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run the Full-Stack Application

In terminal 1 (Backend Express API):
```bash
cd server
npm run dev
# Active on http://localhost:5000
```

In terminal 2 (Frontend React Client):
```bash
cd client
npm run dev
# Active on http://localhost:5173
```

---

## 5. Instant Evaluation (1-Click Demo Account)

ScholarMesh AI comes pre-seeded with a comprehensive biomedical research workspace out of the box.

- **Demo Account Email:** `demo@scholarmesh.ai`
- **Demo Account Password:** `DemoPass123!`
- **1-Click Login:** Simply navigate to `http://localhost:5173/login` and click **"1-Click Demo Researcher Login"**.

### Pre-Seeded Workspace Features:
- **Title:** *mRNA Delivery Lipid Nanoparticles: Efficacy vs. Hepatic Toxicity*
- **Research Question:** *What is the optimal ionizable lipid pKa threshold for achieving high mRNA translation efficiency while preventing acute hepatic toxicity and inflammatory cytokine cascade?*
- **Working Hypothesis:** *Lipid nanoparticles with ionizable lipid pKa between 6.2 and 6.5 maximize endosomal escape while demonstrating a 40% reduction in ALT/AST elevation compared to higher pKa formulations.*
- **Pre-Ingested Studies:**
  1. *Optimization of Ionizable Cationic Lipids for Splenic and Hepatic mRNA Delivery* (Vance et al., 2024, Rigor: 88/100)
  2. *Dose-Limiting Hepatotoxicity and Inflammatory Cytokine Release in High-Efficiency LNP Formulations* (Kowalski et al., 2023, Rigor: 82/100) — *The Direct Contradiction Study*
  3. *Comparative Biodistribution and Biodegradability of Ester-Linked Ionizable Lipids* (Lindqvist et al., 2024, Rigor: 92/100)
- **Pre-Computed Contradiction Audit:** Detailed explanation showing that Kowalski et al.'s acute ALT surge (>320 U/L) resulted from rapid tail-vein bolus shear shock rather than the pKa 6.4 lipid itself, resolved by Lindqvist et al.'s 30-minute controlled infusion protocol.
- **Interactive Claims Matrix:** 9 verified atomic claims categorized by empirical findings, statistics, methodology notes, and limitations.

---

## 6. End-to-End API Documentation

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register new researcher account with institution & role | No |
| `POST` | `/api/auth/login` | Authenticate with email/password; returns JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user profile and aggregate workspace counts | Yes |
| `GET` | `/api/workspaces` | List user workspaces with dynamic source/claim/synthesis counts | Yes |
| `POST` | `/api/workspaces` | Create research workspace with hypothesis & default lens | Yes |
| `GET` | `/api/workspaces/:id` | Fetch full workspace command center details & sources | Yes |
| `DELETE` | `/api/workspaces/:id` | Cascade delete workspace and all associated sources | Yes |
| `POST` | `/api/workspaces/:id/sources` | Ingest PDF/TXT/MD document via Multer or JSON body; calls Gemini | Yes |
| `GET` | `/api/workspaces/:id/sources` | List all ingested sources in workspace ordered by date | Yes |
| `DELETE` | `/api/workspaces/:id/sources/:sourceId` | Delete source and associated atomic claims | Yes |
| `GET` | `/api/workspaces/:id/sources/claims/all` | Filterable matrix of atomic claims across workspace | Yes |
| `POST` | `/api/workspaces/:id/synthesize` | Multi-source synthesis run comparing 2+ papers with Gemini | Yes |
| `GET` | `/api/workspaces/:id/syntheses` | List synthesis reports for workspace | Yes |
| `GET` | `/api/syntheses` | Cross-workspace synthesis library archive | Yes |
| `GET` | `/api/workspaces/:id/copilot` | Retrieve conversation thread history for workspace | Yes |
| `POST` | `/api/workspaces/:id/copilot` | Submit question to Citation-Grounded Research Copilot | Yes |

---

## 7. Production Deployment Guide

### Option A: PostgreSQL Setup (Supabase / Neon / Railway)
1. Create a PostgreSQL project on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy the Connection Pooling URL (with SSL enabled).
3. Set `DATABASE_URL` in your backend environment variables. The server will automatically execute `server/src/db/init.sql` on boot.

### Option B: Backend Deployment (Render / Railway / Fly.io)
1. Connect your repository to Render or Railway.
2. Set Root Directory to `server`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Configure Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `DATABASE_URL=<your-postgres-url>`
   - `JWT_SECRET=<strong-random-key>`
   - `GEMINI_API_KEY=<your-google-gemini-key>`
   - `CLIENT_URL=https://your-frontend.vercel.app`

### Option C: Frontend Deployment (Vercel / Netlify)
1. Connect repository to Vercel or Netlify.
2. Set Root Directory to `client`.
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_BASE_URL=https://your-backend.railway.app/api`

---

## 8. License & Attribution

ScholarMesh AI is open-source under the **MIT License**.  
Engineered for the **AI for Research & Knowledge Discovery Challenge** with the **Google Gemini 2.5 Flash** SDK (`@google/genai`).
