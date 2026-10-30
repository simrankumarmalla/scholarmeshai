import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { ArrowLeft, Sparkles, FlaskConical, AlertCircle, Loader2 } from 'lucide-react';

const DOMAIN_OPTIONS = [
  { value: 'biomedical_clinical', label: 'Biomedical, Healthcare & Clinical Research' },
  { value: 'ai_computer_science', label: 'Artificial Intelligence, Systems & Computer Science' },
  { value: 'climate_sustainability', label: 'Climate Science, Energy & Environmental Policy' },
  { value: 'economics_market', label: 'Macroeconomics, Financial Markets & Policy Intelligence' },
  { value: 'legal_regulatory', label: 'Legal Precedent, Compliance & Regulatory Analysis' },
  { value: 'social_behavioral', label: 'Social Sciences, Psychology & Public Policy' }
];

const SYNTHESIS_MODES = [
  { value: 'systematic_review', label: 'Systematic Literature Review' },
  { value: 'contradiction_audit', label: 'Contradiction & Bias Audit' },
  { value: 'decision_brief', label: 'Decision Brief & Policy Recommendations' },
  { value: 'gap_analysis', label: 'Unexplored Research Gap Analysis' }
];

const CreateWorkspacePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    domain: 'biomedical_clinical',
    research_question: '',
    working_hypothesis: '',
    default_synthesis_mode: 'contradiction_audit'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.trim().length < 5) {
      setError('Workspace title must be at least 5 characters long.');
      return;
    }

    if (formData.research_question.trim().length < 10) {
      setError('Primary research question must be at least 10 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/workspaces', formData);
      if (res.data.success) {
        navigate(`/workspaces/${res.data.workspace.id}`);
      }
    } catch (err) {
      console.error('Workspace creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create research workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Initialize New Research Workspace</h1>
            <p className="text-xs text-slate-400 mt-1">
              Define the epistemological scope, core inquiry, and baseline hypothesis for literature synthesis
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workspace Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. mRNA Delivery Lipid Nanoparticles: Efficacy vs. Hepatic Toxicity"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Research Domain <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Research Question <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={formData.research_question}
                onChange={(e) => setFormData({ ...formData, research_question: e.target.value })}
                placeholder="What is the core question this workspace seeks to resolve across fragmented literature?"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Working Hypothesis <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={formData.working_hypothesis}
                onChange={(e) => setFormData({ ...formData, working_hypothesis: e.target.value })}
                placeholder="Your initial proposition or mechanistic assumption to be validated or refuted..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Synthesis Mode
              </label>
              <select
                value={formData.default_synthesis_mode}
                onChange={(e) => setFormData({ ...formData, default_synthesis_mode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
              >
                {SYNTHESIS_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing Workspace...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Workspace
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspacePage;
