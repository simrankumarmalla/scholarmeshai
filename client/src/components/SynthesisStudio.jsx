import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import MarkdownExporter from './MarkdownExporter';
import { Layers, Sparkles, CheckSquare, Square, AlertTriangle, ArrowRight, Loader2, Award, History, BookOpen, HelpCircle } from 'lucide-react';

const SYNTHESIS_LENSES = [
  {
    id: 'systematic_review',
    title: 'Systematic Literature Review',
    desc: 'Comprehensive synthesis of findings, methods, and sample rigor across cohorts.'
  },
  {
    id: 'contradiction_audit',
    title: 'Contradiction & Bias Audit',
    desc: 'Scrutinizes conflicting data points, methodological variance, and opposing conclusions.'
  },
  {
    id: 'decision_brief',
    title: 'Decision Brief & Policy Matrix',
    desc: 'Translates research findings into executive policy or engineering recommendations with risk levels.'
  },
  {
    id: 'gap_analysis',
    title: 'Unexplored Gap Analysis',
    desc: 'Identifies untested variables, demographic blind spots, and future study hypotheses.'
  }
];

const SynthesisStudio = ({ workspace, sources = [], syntheses = [], onSynthesisGenerated }) => {
  const [selectedSourceIds, setSelectedSourceIds] = useState(() => sources.map(s => s.id));
  const [synthesisMode, setSynthesisMode] = useState(workspace.default_synthesis_mode || 'contradiction_audit');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeReport, setActiveReport] = useState(() => (syntheses.length > 0 ? syntheses[0] : null));

  const toggleSource = (id) => {
    if (selectedSourceIds.includes(id)) {
      setSelectedSourceIds(selectedSourceIds.filter(sId => sId !== id));
    } else {
      setSelectedSourceIds([...selectedSourceIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedSourceIds.length === sources.length) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(sources.map(s => s.id));
    }
  };

  const handleRunSynthesis = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedSourceIds.length < 2) {
      setError('Please select at least 2 research sources for cross-source synthesis.');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post(`/workspaces/${workspace.id}/synthesize`, {
        source_ids: selectedSourceIds,
        synthesis_mode: synthesisMode,
        title: customTitle || undefined
      });

      if (res.data.success) {
        setActiveReport(res.data.report);
        onSynthesisGenerated(res.data.report);
        setCustomTitle('');
      }
    } catch (err) {
      console.error('Synthesis error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate cross-source synthesis.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthBanner = (strength) => {
    switch (strength) {
      case 'Strong Consensus':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Moderate Evidence':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'Mixed / Contested':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Trigger Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Cross-Source Knowledge Synthesis Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select 2 or more ingested studies to run multi-document comparative analysis with Gemini 2.5 Flash
            </p>
          </div>

          {syntheses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-slate-500" />
                History:
              </span>
              <select
                value={activeReport?.id || ''}
                onChange={(e) => {
                  const rep = syntheses.find(s => s.id === e.target.value);
                  if (rep) setActiveReport(rep);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[220px] truncate"
              >
                {syntheses.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {idx + 1}. {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRunSynthesis} className="space-y-5">
          {/* Step 1: Select Sources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                Select Studies for Multi-Document Synthesis ({selectedSourceIds.length}/{sources.length})
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {selectedSourceIds.length === sources.length ? 'Deselect All' : 'Select All Sources'}
              </button>
            </div>

            {sources.length < 2 ? (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                This workspace has fewer than 2 sources. Ingest at least 2 research papers or notes to run cross-source synthesis.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sources.map((s) => {
                  const isChecked = selectedSourceIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSource(s.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-slate-100'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-slate-200">{s.title}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.authors}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            Rigor: {s.rigor_score}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Choose Synthesis Lens */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Choose Analytical Synthesis Lens (synthesis_mode)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SYNTHESIS_LENSES.map((lens) => (
                <div
                  key={lens.id}
                  onClick={() => setSynthesisMode(lens.id)}
                  className={`cursor-pointer p-3 rounded-xl border text-xs transition-all ${
                    synthesisMode === lens.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-slate-200 mb-1">{lens.title}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">{lens.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Title & Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Custom Report Title (e.g., LNP Infusion Protocol vs Hepatic Stress Synthesis)..."
              className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || selectedSourceIds.length < 2}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synthesizing with Gemini 2.5 Flash...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Cross-Source Synthesis
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Render Active Synthesis Report View */}
      {activeReport ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 print-area">
          {/* Header & Export Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase font-mono">
                  {activeReport.synthesis_mode?.replace('_', ' ')}
                </span>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${getStrengthBanner(
                    activeReport.overall_evidence_strength
                  )}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Evidence Strength: {activeReport.overall_evidence_strength}
                </span>

                <span className="text-[11px] text-slate-500">
                  {new Date(activeReport.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100">{activeReport.title}</h2>
            </div>

            <MarkdownExporter report={activeReport} workspaceTitle={workspace.title} />
          </div>

          {/* 1. Executive Literature Review */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              1. Executive Literature Synthesis
            </h4>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {activeReport.executive_summary}
            </div>
          </div>

          {/* 2. Consensus Themes Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              2. Consensus Themes Matrix
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Array.isArray(activeReport.consensus_themes)
                ? activeReport.consensus_themes
                : JSON.parse(activeReport.consensus_themes || '[]')
              ).map((theme, i) => (
                <div
                  key={i}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2"
                >
                  <h5 className="font-semibold text-slate-100 text-sm">{theme.theme_title}</h5>
                  <p className="text-slate-300 leading-relaxed">{theme.synthesis_statement}</p>
                  {theme.supporting_source_titles && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
                        Supporting Sources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {theme.supporting_source_titles.map((title, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 truncate max-w-[280px]"
                            title={title}
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Direct Contradictions & Discrepancies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              3. Contradiction & Discrepancy Alerts
            </h4>
            {(() => {
              const contradictions = Array.isArray(activeReport.contradictions)
                ? activeReport.contradictions
                : JSON.parse(activeReport.contradictions || '[]');

              if (contradictions.length === 0) {
                return (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                    No empirical contradictions identified between the selected sources.
                  </p>
                );
              }

              return (
                <div className="space-y-3">
                  {contradictions.map((ct, i) => (
                    <div
                      key={i}
                      className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-sm">{ct.topic}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Empirical Discrepancy
                        </span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        <strong className="text-amber-200">Conflicting Positions:</strong> {ct.conflicting_positions}
                      </p>
                      <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <strong className="text-indigo-300">Methodological Root Cause:</strong>{' '}
                        {ct.methodological_reason}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 4. Unanswered Research Gaps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              4. Identified Literature Gaps & Future Directions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Array.isArray(activeReport.research_gaps)
                ? activeReport.research_gaps
                : JSON.parse(activeReport.research_gaps || '[]')
              ).map((gap, i) => (
                <div
                  key={i}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2"
                >
                  <h5 className="font-semibold text-slate-100">{gap.gap_title}</h5>
                  <p className="text-slate-400 leading-relaxed">{gap.description}</p>
                  <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-lg text-sky-300 text-[11px]">
                    <strong>Proposed Study:</strong> {gap.suggested_next_study}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Evidence-Based Decision Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              5. Evidence-Based Decision Matrix
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Action Item</th>
                    <th className="px-4 py-3">Strategic Recommendation</th>
                    <th className="px-4 py-3">Evidence Confidence</th>
                    <th className="px-4 py-3">Risk If Ignored</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {(Array.isArray(activeReport.decision_recommendations)
                    ? activeReport.decision_recommendations
                    : JSON.parse(activeReport.decision_recommendations || '[]')
                  ).map((dec, i) => (
                    <tr key={i} className="hover:bg-slate-900/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-200">{dec.action_title}</td>
                      <td className="px-4 py-3 leading-relaxed">{dec.recommendation}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {dec.evidence_confidence}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-rose-300/90 text-[11px] leading-tight">
                        {dec.risk_if_ignored}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No Synthesis Generated Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select 2 or more sources above and click "Run Cross-Source Synthesis" to build your literature review, contradiction audit, and decision matrix.
          </p>
        </div>
      )}
    </div>
  );
};

export default SynthesisStudio;
