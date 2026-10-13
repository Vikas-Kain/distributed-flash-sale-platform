import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, Sparkles, LayoutDashboard, User as UserIcon, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[1.5px] group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Ticket className="w-5 h-5 text-brand-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Pulse<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">Pass</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">Live</span>
            </span>
            <span className="text-[10px] text-slate-400 -mt-1 font-medium tracking-wide">High-Concurrency Ticketing</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/'
                ? 'text-white bg-slate-800/80 shadow-sm border border-slate-700/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Explore Events
          </Link>

          {isAuthenticated && (
            <Link
              to="/my-bookings"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                location.pathname === '/my-bookings'
                  ? 'text-white bg-slate-800/80 shadow-sm border border-slate-700/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Ticket className="w-4 h-4 text-brand-400" />
              My Tickets
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                location.pathname === '/admin'
                  ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              Admin Console
            </Link>
          )}
        </nav>

        {/* Right Action: Auth / User Controls */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user.name}</span>
                  <span className="text-[10px] text-slate-400 -mt-0.5">
                    {user.role === 'ROLE_ADMIN' ? (
                      <span className="text-amber-400 font-medium">Administrator</span>
                    ) : (
                      'Customer'
                    )}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
