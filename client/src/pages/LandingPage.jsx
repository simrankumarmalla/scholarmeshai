import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Bot, Shield, Cpu, Award } from 'lucide-react';
import { DOMAIN_META } from '../components/WorkspaceCard';

const LandingPage = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemo = async () => {
    const res = await demoLogin();
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI for Research & Knowledge Discovery
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Cross-Source Research Synthesis & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              Contradiction Discovery Engine
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Stop losing 60% of your workflow to manual literature cross-referencing. Ingest multi-modal PDFs, notes, and study abstracts into dedicated Research Workspaces. Automatically extract atomic claims, uncover empirical contradictions, and query your corpus with a citation-grounded Copilot powered by Google Gemini 2.5 Flash.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>1-Click Demo Researcher Login</span>
            </button>

            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Interactive Feature Snapshot Preview */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="font-mono text-slate-400 ml-2">mRNA Delivery Lipid Nanoparticles: Efficacy vs Hepatic Toxicity</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px] font-semibold">Gemini 2.5 Flash Verified</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono block mb-1">Study 1 (Vance et al.)</span>
                  <p className="text-slate-200 font-medium">pKa 6.4 achieves 4.2x higher hepatocyte translation; ALT remains physiological (&lt;45 U/L).</p>
                  <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">Rigor: 88/100</span>
                </div>

                <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] font-bold text-amber-400 uppercase font-mono block mb-1">Study 2 (Kowalski et al.)</span>
                  <p className="text-slate-200 font-medium">pKa &lt; 6.5 triggers acute hepatotoxicity (ALT &gt;320 U/L) and severe IL-6 surge.</p>
                  <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono">Discrepancy: Bolus IV</span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-sky-400 uppercase font-mono block mb-1">ScholarMesh Synthesis</span>
                  <p className="text-slate-200 font-medium">Contradiction resolved: Bolus shear shock caused Kowalski surge; 30-min infusion with ester lipids mitigates IL-6 completely.</p>
                  <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono">Strong Consensus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Problem & Solution Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for High-Stakes Scientific Literature Analysis
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Eliminate cognitive overload and blind spots with automated atomic claim decomposition and cross-study deconvolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Multi-Format Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload .pdf, .txt, or .md files via Multer memory buffers or paste raw notes and study abstracts. Server-side parsing extracts full text effortlessly.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Atomic Claims Matrix</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every document is decomposed into structured atomic claims tagged by category (empirical findings, statistics, methodologies, limitations) and confidence.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Contradiction Auditing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cross-reference multiple papers simultaneously to pinpoint where data contradicts and pinpoint the methodological root causes (e.g. sample size, delivery route).
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Citation Copilot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A conversational RAG research assistant that answers inquiries with strict inline citations and provides structured follow-up investigation questions.
            </p>
          </div>
        </div>
      </section>

      {/* Target Domains Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/30 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white">6 Specialized Research Domains</h2>
            <p className="text-xs text-slate-400 mt-1">
              Customized epistemological schemas tailored to your domain's specific analytical standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(DOMAIN_META).map(([key, info]) => (
              <div key={key} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full border ${info.badge}`} />
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{info.label}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">domain: {key}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="mt-auto py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p className="mb-2">ScholarMesh AI — Multi-Source Research Synthesis & Evidence Discovery Platform</p>
        <p>Built with Node.js, Express, PostgreSQL, React 18, Tailwind CSS & Google Gen AI SDK (@google/genai)</p>
      </footer>
    </div>
  );
};

export default LandingPage;

