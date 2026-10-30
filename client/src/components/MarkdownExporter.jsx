import React from 'react';
import { Download, Printer } from 'lucide-react';

const MarkdownExporter = ({ report, workspaceTitle }) => {
  if (!report) return null;

  const generateMarkdown = () => {
    const consensus = Array.isArray(report.consensus_themes)
      ? report.consensus_themes
      : typeof report.consensus_themes === 'string'
      ? JSON.parse(report.consensus_themes || '[]')
      : [];

    const contradictions = Array.isArray(report.contradictions)
      ? report.contradictions
      : typeof report.contradictions === 'string'
      ? JSON.parse(report.contradictions || '[]')
      : [];

    const gaps = Array.isArray(report.research_gaps)
      ? report.research_gaps
      : typeof report.research_gaps === 'string'
      ? JSON.parse(report.research_gaps || '[]')
      : [];

    const decisions = Array.isArray(report.decision_recommendations)
      ? report.decision_recommendations
      : typeof report.decision_recommendations === 'string'
      ? JSON.parse(report.decision_recommendations || '[]')
      : [];

    return `# ${report.title}
**Workspace:** ${workspaceTitle || 'Research Workspace'}  
**Synthesis Mode:** ${report.synthesis_mode}  
**Overall Evidence Strength:** ${report.overall_evidence_strength}  
**Generated Date:** ${new Date(report.created_at).toLocaleDateString()}  

---

## 1. Executive Literature Review & Synthesis
${report.executive_summary}

---

## 2. Consensus Themes Matrix
${consensus.map((c, i) => `### 2.${i + 1} ${c.theme_title}
${c.synthesis_statement}
*Supporting Sources:* ${c.supporting_source_titles ? c.supporting_source_titles.join(', ') : 'N/A'}
`).join('\n')}

---

## 3. Direct Contradictions & Methodological Discrepancies
${contradictions.length > 0 ? contradictions.map((ct, i) => `### 3.${i + 1} ${ct.topic}
**Conflicting Positions:** ${ct.conflicting_positions}
**Methodological Reason:** ${ct.methodological_reason}
**Sources Involved:** ${ct.sources_involved ? ct.sources_involved.join(', ') : 'N/A'}
`).join('\n') : '*No empirical contradictions identified between the selected sources.*'}

---

## 4. Unanswered Research Gaps & Proposed Studies
${gaps.map((g, i) => `### 4.${i + 1} ${g.gap_title}
${g.description}
*Suggested Follow-Up Study:* ${g.suggested_next_study}
`).join('\n')}

---

## 5. Evidence-Based Decision Matrix & Recommendations
| Action Title | Recommendation | Evidence Confidence | Risk if Ignored |
| --- | --- | --- | --- |
${decisions.map(d => `| **${d.action_title}** | ${d.recommendation} | ${d.evidence_confidence} | ${d.risk_if_ignored} |`).join('\n')}

---
*Synthesized automatically by ScholarMesh AI Engine with Google Gemini.*
`;
  };

  const handleDownload = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (report.title || 'synthesis_report').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${sanitizedTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 no-print">
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        title="Download Clean Markdown Report"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span>Export Markdown (.md)</span>
      </button>

      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        title="Print or Save as PDF"
      >
        <Printer className="w-3.5 h-3.5 text-emerald-400" />
        <span>Print / PDF View</span>
      </button>
    </div>
  );
};

export default MarkdownExporter;

