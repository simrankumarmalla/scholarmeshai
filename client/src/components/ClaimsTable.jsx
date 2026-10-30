import React, { useState, useMemo } from 'react';
import { Search, Filter, Quote, CheckCircle2, AlertCircle, Award } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Claim Types' },
  { value: 'empirical_finding', label: 'Empirical Findings' },
  { value: 'statistic', label: 'Statistics & Metrics' },
  { value: 'methodology', label: 'Methodology & Controls' },
  { value: 'limitation', label: 'Study Limitations' },
  { value: 'hypothesis', label: 'Hypotheses' }
];

const ClaimsTable = ({ claims = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedConfidence, setSelectedConfidence] = useState('all');

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesSearch =
        !searchTerm ||
        claim.claim_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (claim.supporting_quote && claim.supporting_quote.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (claim.source_title && claim.source_title.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || claim.claim_category === selectedCategory;

      const matchesConfidence =
        selectedConfidence === 'all' || claim.confidence_level === selectedConfidence;

      return matchesSearch && matchesCategory && matchesConfidence;
    });
  }, [claims, searchTerm, selectedCategory, selectedConfidence]);

  const getCategoryPill = (cat) => {
    switch (cat) {
      case 'empirical_finding':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'statistic':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'methodology':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'limitation':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'hypothesis':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-700/20 text-slate-300 border-slate-700/40';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search claims, quotes, or source titles..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Confidence Dropdown */}
          <select
            value={selectedConfidence}
            onChange={(e) => setSelectedConfidence(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Confidences</option>
            <option value="high">High Confidence</option>
            <option value="medium">Medium Confidence</option>
            <option value="low">Low Confidence</option>
          </select>
        </div>
      </div>

      {/* Claims Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200">{filteredClaims.length}</strong> of{' '}
          <strong className="text-slate-200">{claims.length}</strong> atomic claims
        </span>
      </div>

      {/* Claims Grid/List */}
      {filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 rounded-xl border border-slate-800/80">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300 mb-1">No Claims Match Your Filter</h4>
          <p className="text-xs text-slate-500">Try adjusting your search terms or claim type filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all shadow-sm"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${getCategoryPill(
                      claim.claim_category
                    )}`}
                  >
                    {claim.claim_category?.replace('_', ' ')}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    Confidence:{' '}
                    <strong
                      className={`uppercase ${
                        claim.confidence_level === 'high'
                          ? 'text-emerald-400'
                          : claim.confidence_level === 'medium'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {claim.confidence_level}
                    </strong>
                  </span>
                </div>

                {/* Source attribution pill */}
                {claim.source_title && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-md border border-slate-800">
                    <span className="truncate max-w-[240px] font-medium text-slate-300" title={claim.source_title}>
                      {claim.source_title}
                    </span>
                    {claim.source_rigor_score !== undefined && (
                      <span className="text-[10px] text-emerald-400 font-mono" title="Methodology Rigor Score">
                        ({claim.source_rigor_score}/100)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Claim Statement */}
              <p className="text-sm text-slate-100 font-medium leading-relaxed mb-2">
                {claim.claim_text}
              </p>

              {/* Supporting Quote */}
              {claim.supporting_quote && (
                <div className="flex items-start gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 italic">
                  <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>"{claim.supporting_quote}"</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaimsTable;

