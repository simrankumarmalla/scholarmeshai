import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Sparkles, LogIn, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      setDemoLoading(true);
      const res = await demoLogin();
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'Demo login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo researcher login failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">ScholarMesh AI</span>
          </Link>
          <h2 className="text-lg font-bold text-slate-100">Researcher Sign In</h2>
          <p className="text-xs text-slate-400">
            Access your research workspaces, claims matrix & copilot
          </p>
        </div>

        {/* 1-Click Demo Login Banner Button */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Instant Evaluation
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Pre-seeded Corpus</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
          >
            {demoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Demo Session...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                1-Click Demo Researcher Login
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] uppercase font-mono text-slate-500 absolute">
            Or sign in with email
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. researcher@institution.edu"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Register Footer */}
        <div className="text-center text-xs text-slate-400 pt-2">
          New to ScholarMesh?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

