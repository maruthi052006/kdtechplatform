import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  Sun,
  Moon,
  Shield,
  UserCheck,
  ChevronRight,
  Terminal,
  Cpu,
} from 'lucide-react';

export const PublicLayout = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full glass-nav border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                KDTech<span className="text-cyan-400">X</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold block -mt-1">
                Assessment Portal
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#capabilities" className="hover:text-cyan-400 transition-colors">
              Platform
            </a>
            <a href="#curriculum" className="hover:text-cyan-400 transition-colors">
              Curriculum
            </a>
            <a href="#assessments" className="hover:text-cyan-400 transition-colors">
              Assessments
            </a>
            <a href="#security" className="hover:text-cyan-400 transition-colors">
              Anti-Cheat Engine
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {user ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/student/dashboard')}
                icon={ChevronRight}
                iconPosition="right"
              >
                Go to Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/student/login">
                  <Button size="sm" variant="secondary" icon={UserCheck}>
                    Student Login
                  </Button>
                </Link>
                <Link to="/admin/login">
                  <Button size="sm" variant="primary" icon={Shield}>
                    Trainer Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <p>
              <strong className="text-slate-200">KDTechX Learning & Assessment Portal</strong> © 2026.
              All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-500">Learn. Practice. Assess. Grow.</span>
            <Link to="/admin/login" className="hover:text-cyan-400 transition-colors">
              Trainer Portal
            </Link>
            <Link to="/student/login" className="hover:text-cyan-400 transition-colors">
              Student Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
