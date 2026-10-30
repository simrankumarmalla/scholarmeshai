import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { DOMAIN_META } from '../components/WorkspaceCard';
import SourceCard from '../components/SourceCard';
import SourceUploadModal from '../components/SourceUploadModal';
import ClaimsTable from '../components/ClaimsTable';
import SynthesisStudio from '../components/SynthesisStudio';
import CopilotChat from '../components/CopilotChat';
import {
  ArrowLeft,
  Plus,
  FileText,
  CheckCircle2,
  Layers,
  Bot,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';

const WorkspaceDetailPage = () => {
  const { id } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [sources, setSources] = useState([]);
  const [claims, setClaims] = useState([]);
  const [syntheses, setSyntheses] = useState([]);
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('corpus'); // 'corpus' | 'claims' | 'synthesis' | 'copilot'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch Workspace & Ingested Sources
      const wsRes = await axiosClient.get(`/workspaces/${id}`);
      if (!wsRes.data.success) throw new Error('Workspace not found');

      setWorkspace(wsRes.data.workspace);
      setSources(wsRes.data.workspace.sources || []);
      setSyntheses(wsRes.data.workspace.syntheses || []);

      // Fetch Extracted Claims
      const claimsRes = await axiosClient.get(`/workspaces/${id}/sources/claims/all`);
      if (claimsRes.data.success) {
        setClaims(claimsRes.data.claims);
      }

      // Fetch Copilot Messages
      const copilotRes = await axiosClient.get(`/workspaces/${id}/copilot`);
      if (copilotRes.data.success) {
        setCopilotMessages(copilotRes.data.messages);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
      setError(err.response?.data?.message || err.message || 'Error loading research workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const handleSourceAdded = (newSource) => {
    fetchWorkspaceData();
  };

  const handleDeleteSource = async (sourceId) => {
    try {
      const res = await axiosClient.delete(`/workspaces/${id}/sources/${sourceId}`);
      if (res.data.success) {
        fetchWorkspaceData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete source');
    }
  };

  const handleSynthesisGenerated = (newReport) => {
    setSyntheses(prev => [newReport, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading Research Command Center...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="text-base font-semibold text-white">{error || 'Workspace Not Found'}</h3>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const domainInfo = DOMAIN_META[workspace.domain] || {
    label: workspace.domain,
    badge: 'bg-slate-800 text-slate-300'
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Workspace Command Header */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspaces</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${domainInfo.badge}`}>
                  {domainInfo.label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Default Lens: {workspace.default_synthesis_mode?.replace('_', ' ')}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {workspace.title}
              </h1>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="self-start lg:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Ingest Source Document</span>
            </button>
          </div>

          {/* Research Question & Hypothesis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
              <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px] block mb-1">
                Primary Research Question
              </span>
              <p className="text-slate-200 italic leading-relaxed">
                "{workspace.research_question}"
              </p>
            </div>

            {workspace.working_hypothesis && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                  Working Hypothesis
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {workspace.working_hypothesis}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[57px] z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('corpus')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'corpus'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Corpus & Sources ({sources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'claims'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Claim & Evidence Explorer ({claims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('synthesis')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'synthesis'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cross-Source Synthesis Studio ({syntheses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'copilot'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Research Copilot</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* TAB 1: Corpus & Sources */}
        {activeTab === 'corpus' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Ingested Research Corpus</h3>
                <p className="text-xs text-slate-400">
                  Academic papers, field notes, and study abstracts indexed in this workspace
                </p>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Paper / Notes</span>
              </button>
            </div>

            {sources.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">No Sources Ingested Yet</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload your first research paper (.pdf, .txt, .md) or paste study notes to extract atomic claims and evaluate methodology.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Ingest First Study
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sources.map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    claims={claims.filter(c => c.source_id === source.id)}
                    onDelete={handleDeleteSource}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Claim & Evidence Explorer */}
        {activeTab === 'claims' && (
          <ClaimsTable claims={claims} />
        )}

        {/* TAB 3: Cross-Source Synthesis Studio */}
        {activeTab === 'synthesis' && (
          <SynthesisStudio
            workspace={workspace}
            sources={sources}
            syntheses={syntheses}
            onSynthesisGenerated={handleSynthesisGenerated}
          />
        )}

        {/* TAB 4: Grounded Research Copilot */}
        {activeTab === 'copilot' && (
          <CopilotChat
            workspace={workspace}
            initialMessages={copilotMessages}
          />
        )}
      </div>

      {/* Dual-Mode Upload Modal */}
      <SourceUploadModal
        workspaceId={workspace.id}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSourceAdded={handleSourceAdded}
      />
    </div>
  );
};

export default WorkspaceDetailPage;

