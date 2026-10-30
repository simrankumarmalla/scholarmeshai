import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    institution: 'Independent Research Institute',
    research_role: 'Principal Investigator',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await register(formData);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
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
          <h2 className="text-lg font-bold text-slate-100">Create Researcher Account</h2>
          <p className="text-xs text-slate-400">
            Set up your identity and begin synthesizing research literature
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Dr. Arisawa Thorne"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Institution / Org
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g. Stanford Medical"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Research Role
              </label>
              <input
                type="text"
                value={formData.research_role}
                onChange={(e) => setFormData({ ...formData, research_role: e.target.value })}
                placeholder="e.g. Lead Scientist"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Institutional Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. investigator@institute.org"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password (min. 6 characters) <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering Account...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Complete Registration
              </>
            )}
          </button>
        </form>

        {/* Login Footer */}
        <div className="text-center text-xs text-slate-400 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

