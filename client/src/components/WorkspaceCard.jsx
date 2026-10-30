import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Cpu, Trash2, ArrowUpRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const DOMAIN_META = {
  biomedical_clinical: {
    label: 'Biomedical & Clinical Sciences',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  ai_computer_science: {
    label: 'AI & Computer Science',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  climate_sustainability: {
    label: 'Climate & Sustainability',
    badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
  },
  economics_market: {
    label: 'Economics & Markets',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  legal_regulatory: {
    label: 'Legal & Regulatory Analysis',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  },
  social_behavioral: {
    label: 'Social & Behavioral Sciences',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  }
};

const WorkspaceCard = ({ workspace, onDelete }) => {
  const domainInfo = DOMAIN_META[workspace.domain] || {
    label: workspace.domain,
    badge: 'bg-slate-700/20 text-slate-300 border-slate-700/40'
  };

  const formattedDate = new Date(workspace.updated_at || workspace.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl hover:shadow-indigo-500/5">
      <div>
        {/* Top Badges & Delete */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${domainInfo.badge}`}>
            {domainInfo.label}
          </span>

          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete workspace "${workspace.title}"? This cannot be undone.`)) {
                  onDelete(workspace.id);
                }
              }}
              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Delete workspace"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <Link to={`/workspaces/${workspace.id}`} className="block group-hover:text-indigo-400 transition-colors">
          <h3 className="font-semibold text-slate-100 text-base leading-snug line-clamp-2 mb-2 flex items-center justify-between">
            <span>{workspace.title}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
          </h3>
        </Link>

        {/* Research Question */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 italic">
          "{workspace.research_question}"
        </p>
      </div>

      <div>
        {/* Working Hypothesis preview if present */}
        {workspace.working_hypothesis && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 mb-4 text-[11px] text-slate-400 line-clamp-2">
            <span className="font-semibold text-slate-300">Hypothesis:</span> {workspace.working_hypothesis}
          </div>
        )}

        {/* Workspace Metrics Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300" title="Ingested sources">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              {workspace.source_count || 0}
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300" title="Extracted claims">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {workspace.claim_count || 0}
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300" title="Syntheses generated">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              {workspace.synthesis_count || 0}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCard;
