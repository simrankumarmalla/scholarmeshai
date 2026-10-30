import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import MarkdownExporter from '../components/MarkdownExporter';
import { DOMAIN_META } from '../components/WorkspaceCard';
import {
  BookOpen,
  Search,
  Layers,
  Award,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Calendar,
  X,
  HelpCircle
} from 'lucide-react';

const SavedSynthesesPage = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/syntheses');
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error('Failed to load syntheses archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.workspace_title && r.workspace_title.toLowerCase().includes(q)) ||
      r.executive_summary.toLowerCase().includes(q)
    );
  });

  const getStrengthBadge = (strength) => {
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
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Knowledge Discovery Archive
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cross-Source Synthesis Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              All literature reviews, contradiction audits, and decision briefs across workspaces
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search synthesized reports..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Reports Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading synthesis archive...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-slate-200">No Synthesis Reports Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? 'No reports match your search query.'
                  : 'Open a workspace and use the Synthesis Studio to generate multi-document syntheses.'}
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Go to Workspaces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md space-y-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {report.synthesis_mode?.replace('_', ' ')}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStrengthBadge(
                        report.overall_evidence_strength
                      )}`}
                    >
                      {report.overall_evidence_strength}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mb-1 leading-snug">
                    {report.title}
                  </h3>

                  <p className="text-xs text-indigo-400 font-medium mb-3">
                    Workspace: {report.workspace_title}
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-2">
                    {report.executive_summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => setSelectedReport(report)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Read Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Report Inspection Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {selectedReport.synthesis_mode?.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">{selectedReport.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                <MarkdownExporter
                  report={selectedReport}
                  workspaceTitle={selectedReport.workspace_title}
                />
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  1. Executive Literature Review
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedReport.executive_summary}
                </div>
              </div>

              {/* Consensus Themes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  2. Consensus Themes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Array.isArray(selectedReport.consensus_themes)
                    ? selectedReport.consensus_themes
                    : JSON.parse(selectedReport.consensus_themes || '[]')
                  ).map((theme, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                      <h5 className="font-semibold text-slate-100 text-sm">{theme.theme_title}</h5>
                      <p className="text-slate-300 leading-relaxed">{theme.synthesis_statement}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contradictions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  3. Direct Contradictions & Methodological Nuances
                </h4>
                {(() => {
                  const contradictions = Array.isArray(selectedReport.contradictions)
                    ? selectedReport.contradictions
                    : JSON.parse(selectedReport.contradictions || '[]');

                  if (contradictions.length === 0) {
                    return <p className="text-slate-500 italic">No empirical contradictions flagged.</p>;
                  }

                  return (
                    <div className="space-y-3 text-xs">
                      {contradictions.map((ct, i) => (
                        <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                          <h5 className="font-bold text-amber-300 text-sm">{ct.topic}</h5>
                          <p className="text-slate-200">
                            <strong>Conflicting Positions:</strong> {ct.conflicting_positions}
                          </p>
                          <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <strong>Methodological Cause:</strong> {ct.methodological_reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Decision Recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  4. Evidence-Based Decision Matrix
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Action Title</th>
                        <th className="px-4 py-3">Recommendation</th>
                        <th className="px-4 py-3">Confidence</th>
                        <th className="px-4 py-3">Risk If Ignored</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                      {(Array.isArray(selectedReport.decision_recommendations)
                        ? selectedReport.decision_recommendations
                        : JSON.parse(selectedReport.decision_recommendations || '[]')
                      ).map((dec, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-semibold text-slate-200">{dec.action_title}</td>
                          <td className="px-4 py-3 leading-relaxed">{dec.recommendation}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {dec.evidence_confidence}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-rose-300/90 text-[11px]">{dec.risk_if_ignored}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSynthesesPage;

