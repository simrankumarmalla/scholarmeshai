import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import WorkspaceCard, { DOMAIN_META } from '../components/WorkspaceCard';
import { Plus, Search, FlaskConical, FileText, CheckCircle2, Layers, Sparkles, Filter, Loader2, BookOpen } from 'lucide-react';

const DOMAIN_OPTIONS = [
  { value: 'all', label: 'All Domains' },
  { value: 'biomedical_clinical', label: 'Biomedical & Clinical' },
  { value: 'ai_computer_science', label: 'AI & Systems' },
  { value: 'climate_sustainability', label: 'Climate & Sustainability' },
  { value: 'economics_market', label: 'Economics & Markets' },
  { value: 'legal_regulatory', label: 'Legal & Regulatory' },
  { value: 'social_behavioral', label: 'Social & Behavioral' }
];

const DashboardPage = () => {
  const { user, stats, refreshProfile } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDomain !== 'all') params.domain = selectedDomain;
      if (searchTerm.trim() !== '') params.search = searchTerm.trim();

      const res = await axiosClient.get('/workspaces', { params });
      if (res.data.success) {
        setWorkspaces(res.data.workspaces);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    refreshProfile();
  }, [selectedDomain]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkspaces();
  };

  const handleDeleteWorkspace = async (id) => {
    try {
      const res = await axiosClient.delete(`/workspaces/${id}`);
      if (res.data.success) {
        setWorkspaces(prev => prev.filter(w => w.id !== id));
        refreshProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete workspace');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Top Header / Welcome Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {user?.research_role || 'Researcher'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.institution}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Research Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage multi-source literature corpora, claim extraction, and cross-source syntheses
            </p>
          </div>

          <Link
            to="/workspaces/new"
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Research Workspace</span>
          </Link>
        </div>

        {/* Global Corpus Metrics Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Workspaces</p>
              <h3 className="text-xl font-bold text-white font-mono">{stats?.totalWorkspaces ?? workspaces.length}</h3>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sources Ingested</p>
              <h3 className="text-xl font-bold text-white font-mono">{stats?.totalSources ?? 0}</h3>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Atomic Claims</p>
              <h3 className="text-xl font-bold text-white font-mono">{stats?.totalClaims ?? 0}</h3>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Syntheses</p>
              <h3 className="text-xl font-bold text-white font-mono">{stats?.totalSyntheses ?? 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Directory Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-6">
        {/* Search & Domain Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Domain Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {DOMAIN_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedDomain(d.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
                  selectedDomain === d.value
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title or research question..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </form>
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading research workspaces...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-200">No Research Workspaces Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedDomain !== 'all' || searchTerm
                  ? 'No workspaces match the current filters. Try resetting the domain filter or search query.'
                  : 'Get started by creating your first dedicated research workspace to ingest studies and synthesize findings.'}
              </p>
            </div>
            <Link
              to="/workspaces/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workspace</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onDelete={handleDeleteWorkspace}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
