import React, { useState } from 'react';
import { FileText, Award, ChevronDown, ChevronUp, Trash2, CheckCircle2, Tag, BookOpen, Quote } from 'lucide-react';

export const SOURCE_TYPE_LABELS = {
  peer_reviewed_paper: 'Peer-Reviewed Paper',
  technical_report: 'Technical Report',
  raw_field_notes: 'Lab / Field Notes',
  web_article_abstract: 'Web / Abstract'
};

const SourceCard = ({ source, onDelete, claims = [] }) => {
  const [expandedClaims, setExpandedClaims] = useState(false);

  const getRigorBadge = (score) => {
    if (score >= 75) {
      return {
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        label: 'High Rigor'
      };
    }
    if (score >= 50) {
      return {
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        label: 'Moderate Rigor'
      };
    }
    return {
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      label: 'Preliminary / Low Rigor'
    };
  };

  const rigor = getRigorBadge(source.rigor_score || 0);

  const keyTopics = Array.isArray(source.key_topics)
    ? source.key_topics
    : typeof source.key_topics === 'string'
      ? JSON.parse(source.key_topics || '[]')
      : [];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
            </span>

            {/* Rigor Score Badge */}
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${rigor.badge}`}
              title={source.rigor_justification || 'Methodological assessment score'}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Rigor: {source.rigor_score || 0}/100</span>
              <span className="text-[10px] opacity-80">({rigor.label})</span>
            </span>

            <span className="text-[11px] text-slate-500 font-mono">
              {source.publication_year || 'Unknown Year'}
            </span>
          </div>

          <h3 className="font-semibold text-slate-100 text-base leading-snug">
            {source.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {source.authors || 'Unknown Authors'}
          </p>
        </div>

        {onDelete && (
          <button
            onClick={() => {
              if (confirm(`Remove source "${source.title}" and its extracted claims?`)) {
                onDelete(source.id);
              }
            }}
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Delete source"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* AI Executive Summary */}
      {source.ai_summary && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 mb-3 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1 text-[11px]">
            <BookOpen className="w-3.5 h-3.5" />
            AI Executive Summary
          </div>
          <p>{source.ai_summary}</p>
        </div>
      )}

      {/* Methodology Notes */}
      {source.methodology_notes && (
        <div className="text-xs text-slate-400 mb-3 leading-relaxed">
          <span className="font-semibold text-slate-300">Methodology & Critique:</span>{' '}
          {source.methodology_notes}
        </div>
      )}

      {/* Topics */}
      {keyTopics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <Tag className="w-3 h-3 text-slate-500" />
          {keyTopics.map((topic, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Claims Drawer */}
      <div className="pt-3 border-t border-slate-800">
        <button
          onClick={() => setExpandedClaims(!expandedClaims)}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-indigo-400 py-1 transition-colors"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Extracted Atomic Claims ({claims.length})
          </span>
          {expandedClaims ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {expandedClaims && (
          <div className="mt-3 space-y-2.5 animate-fadeIn">
            {claims.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No atomic claims extracted for this source.</p>
            ) : (
              claims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {claim.claim_category?.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Confidence: <strong className="text-emerald-400 uppercase">{claim.confidence_level}</strong>
                    </span>
                  </div>

                  <p className="text-slate-200 font-medium">{claim.claim_text}</p>

                  {claim.supporting_quote && (
                    <div className="flex items-start gap-1.5 text-slate-400 text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800/60 italic">
                      <Quote className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                      <span>"{claim.supporting_quote}"</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceCard;
