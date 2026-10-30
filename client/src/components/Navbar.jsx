import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, BookOpen, Sparkles, LogOut, User, FlaskConical, Plus } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDemo = async () => {
    const res = await demoLogin();
    if (res.success) {
      navigate('/dashboard');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-100 tracking-tight">ScholarMesh</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                AI Research
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Multi-Source Synthesis & Evidence Discovery</p>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Workspaces</span>
            </Link>

            <Link
              to="/saved-syntheses"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isActive('/saved-syntheses')
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Synthesis Library</span>
            </Link>

            <Link
              to="/workspaces/new"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Workspace</span>
            </Link>

            {/* User Profile & Logout */}
            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-semibold text-slate-200">{user?.full_name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[170px]" title={user?.institution}>
                  {user?.institution}
                </p>
              </div>

              <button
                onClick={logout}
                title="Log out of ScholarMesh"
                className="flex items-center gap-1 p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm shadow-emerald-500/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Demo</span>
            </button>

            <Link
              to="/login"
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

