import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Upload, FileText, AlignLeft, Sparkles, X, AlertCircle, Check, Loader2 } from 'lucide-react';

const SAMPLE_PAPERS = [
  {
    title: 'CRISPR-Cas9 Base Editing Efficiency and Off-Target Indel Frequencies in Primary Human T-Cells',
    authors: 'Sutherland, K., Patel, R., & Zhao, H.',
    publication_year: 2024,
    source_type: 'peer_reviewed_paper',
    raw_content: `Gene editing technologies require ultra-high fidelity to prevent oncogenic translocations. In this investigation, we compared adenine base editors (ABE8e) against prime editors (PEmax) across 14 genomic loci in primary human CD4+ and CD8+ T-lymphocytes (n=45 healthy donors). ABE8e demonstrated an average on-target base modification efficiency of 74.2% ± 3.8%, exceeding PEmax (42.1% ± 5.1%). However, high-throughput CIRCLE-seq deep sequencing identified persistent bystander adenine conversions within the target protospacer window in 18% of reads. Strikingly, guide-independent transcriptome-wide RNA deamination was observed with wild-type TadA domains, whereas engineered TadA-8e variants reduced RNA off-target events by 96% while maintaining on-target DNA cleavage efficiency. Cell viability remained >88% across all electroporation conditions.`
  },
  {
    title: 'Scalable Solid-State Electrolyte Interfacial Impedance in High-Nickel Cathode All-Solid-State Batteries',
    authors: 'Benoit, L., Tanaka, Y., & O\'Connor, E.',
    publication_year: 2023,
    source_type: 'technical_report',
    raw_content: `All-solid-state lithium metal batteries represent the next frontier in volumetric energy density. Here, we investigate sulfide-based solid electrolytes (Li6PS5Cl) integrated with single-crystal LiNi0.8Mn0.1Co0.1O2 (NMC811) cathodes. Electrochemical impedance spectroscopy (EIS) revealed severe interfacial resistance surge exceeding 450 Ohm*cm^2 after only 50 charge-discharge cycles at 1C rate. Cryo-TEM analysis revealed micro-crack propagation along intergranular boundaries accompanied by transition metal dissolution. Application of an ultrathin (3 nm) ALD-deposited LiNbO3 protective buffer layer reduced initial interfacial impedance by 68% and preserved 89.4% capacity retention over 500 full cycles at 25°C. Unresolved challenges remain concerning high-pressure stack mechanics during volumetric expansion.`
  },
  {
    title: 'Behavioral Adherence and Metabolic Outcomes in Intermittent Fasting vs. Continuous Caloric Restriction',
    authors: 'Mercer, D., Al-Mansoor, S., & Klein, J.',
    publication_year: 2024,
    source_type: 'peer_reviewed_paper',
    raw_content: `A 12-month randomized clinical trial (n=210 obese adults, BMI 30-38) evaluated 16:8 time-restricted eating (TRE) against standard isocaloric continuous energy restriction (CER). Both arms exhibited equivalent reductions in mean body mass (-6.4 kg vs -6.8 kg, p=0.48) and visceral adipose tissue volume (-14.2% vs -15.1%). However, continuous continuous glucose monitoring (CGM) indicated a 28% greater reduction in postprandial glucose excursion area under the curve (AUC) in the TRE cohort. Adherence self-reports showed significantly higher protocol compliance in the TRE arm (84% vs 61%, p<0.01), driven by simplified cognitive rules. Dropout rates in the CER cohort were double that of the TRE cohort due to perceived diet fatigue.`
  }
];

const SourceUploadModal = ({ workspaceId, isOpen, onClose, onSourceAdded }) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'text'
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressStep, setProgressStep] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    publication_year: new Date().getFullYear(),
    source_type: 'peer_reviewed_paper',
    raw_content: ''
  });

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: selected.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: selected.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const loadSample = (sample) => {
    setActiveTab('text');
    setFormData({
      title: sample.title,
      authors: sample.authors,
      publication_year: sample.publication_year,
      source_type: sample.source_type,
      raw_content: sample.raw_content
    });
    setFile(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'upload' && !file) {
      setError('Please select a .pdf, .txt, or .md file to upload.');
      return;
    }
    if (activeTab === 'text' && (!formData.raw_content || formData.raw_content.trim().length < 40)) {
      setError('Please paste at least 40 characters of source text/abstract.');
      return;
    }

    try {
      setLoading(true);
      setProgressStep('Extracting document contents & parsing buffer...');

      let response;
      if (activeTab === 'upload') {
        const data = new FormData();
        data.append('document', file);
        data.append('title', formData.title || file.name);
        data.append('authors', formData.authors || 'Unknown Authors');
        data.append('publication_year', formData.publication_year || new Date().getFullYear());
        data.append('source_type', formData.source_type);

        setProgressStep('Running Gemini 2.5 Flash: Extracting atomic claims, methodology & rigor score...');
        response = await axiosClient.post(`/workspaces/${workspaceId}/sources`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        setProgressStep('Running Gemini 2.5 Flash: Extracting atomic claims, methodology & rigor score...');
        response = await axiosClient.post(`/workspaces/${workspaceId}/sources`, formData);
      }

      if (response.data.success) {
        setProgressStep('Knowledge claims successfully indexed into workspace!');
        setTimeout(() => {
          onSourceAdded(response.data.source);
          onClose();
        }, 500);
      }
    } catch (err) {
      console.error('Source upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to ingest source.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Ingest Research Source
            </h2>
            <p className="text-xs text-slate-400">
              Upload papers or paste notes to automatically extract claims, rigor scores & topics
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Selector */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Test:
          </span>
          <div className="flex items-center gap-2">
            {SAMPLE_PAPERS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(sample)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 border border-slate-700 hover:border-indigo-500/40 transition-colors shrink-0"
              >
                Sample {idx + 1}: {sample.title.slice(0, 24)}...
              </button>
            ))}
          </div>
        </div>

        {/* Ingestion Mode Tabs */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setError(''); }}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Document File (.pdf, .txt, .md)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('text'); setError(''); }}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            Raw Study Text / Abstract
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
              }`}
            >
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium text-slate-200 mb-1">
                {file ? file.name : 'Drag and drop your research paper here'}
              </p>
              <p className="text-xs text-slate-400 mb-3">
                PDF, TXT, or MD documents up to 10MB
              </p>
              <label className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm transition-colors">
                Browse File
                <input
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Study Content / Abstract / Notes <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={6}
                value={formData.raw_content}
                onChange={(e) => setFormData({ ...formData, raw_content: e.target.value })}
                placeholder="Paste the study abstract, empirical methodology, findings, or raw notes here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {formData.raw_content.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          )}

          {/* Common Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Paper / Source Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Deep Learning for Cryo-EM"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authors
              </label>
              <input
                type="text"
                value={formData.authors}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                placeholder="e.g., Vance, E., & Chen, K."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Publication Year
              </label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Source Type
              </label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="peer_reviewed_paper">Peer-Reviewed Paper (PDF / Journal)</option>
                <option value="technical_report">Technical Report / Whitepaper</option>
                <option value="raw_field_notes">Researcher Lab Notes / Transcripts</option>
                <option value="web_article_abstract">Web Article / Literature Excerpt</option>
              </select>
            </div>
          </div>

          {/* Progress / Loading Indicator */}
          {loading && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-semibold text-indigo-300">Processing Document with Gemini 2.5 Flash</p>
                <p className="text-[11px] text-indigo-400/80">{progressStep}</p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Indexing Claims...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Ingest & Extract Claims
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SourceUploadModal;

