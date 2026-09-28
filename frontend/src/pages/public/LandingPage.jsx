import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  Terminal,
  Shield,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  Lock,
  ArrowRight,
  Layers,
  Sparkles,
  Users,
  Award,
} from 'lucide-react';


export const LandingPage = () => {
  const navigate = useNavigate();

  const capabilities = [
    {
      icon: BookOpen,
      title: 'Curriculum & Weekly Modules',
      description: 'Structured 12-week courses with topic breakdowns and synchronous assessment milestones.',
      color: 'cyan',
    },
    {
      icon: FileSpreadsheet,
      title: 'SheetJS Excel Question Ingestion',
      description: 'Import hundreds of technical MCQs directly from Excel with real-time schema validation.',
      color: 'blue',
    },
    {
      icon: Shield,
      title: 'Distraction-Free Exam Engine',
      description: 'Fullscreen enforcement, tab-switch detection, and clipboard anti-copy deterrents.',
      color: 'indigo',
    },
    {
      icon: BarChart3,
      title: 'Deep Analytics & Instant Scoring',
      description: 'Deterministic identity-based evaluation, accuracy distribution, and Excel export.',
      color: 'emerald',
    },
  ];

  const weeksSample = [
    { week: '01', title: 'Python Architecture & Data Types', questions: '5 MCQs' },
    { week: '02', title: 'Branching, Loops & Comprehensions', questions: '3 MCQs' },
    { week: '03', title: 'Functions, Scope (LEGB) & Lambdas', questions: '5 MCQs' },
    { week: '04', title: 'Object-Oriented Design & Dunder Methods', questions: '4 MCQs' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-8 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>KDTechX Technical Learning Platform 2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight"
        >
          Learn. Practice. <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Assess. Master.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Structured technical engineering courses and weekly MCQ assessments designed for
          continuous student mastery. Built for trainers, engineering cohorts, and modern bootcamps.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link to="/student/login">
            <Button size="lg" variant="primary" icon={ArrowRight} iconPosition="right">
              Student Assessment Portal
            </Button>
          </Link>
          <Link to="/admin/login">
            <Button size="lg" variant="secondary" icon={Shield}>
              Trainer Management Portal
            </Button>
          </Link>
        </motion.div>
      </section>


      {/* Platform Capabilities */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="cyan" size="sm">Core Architecture</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            Designed for Rigorous Technical Assessments
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Everything modern technical trainers need to organize cohorts, build multi-week curriculums, and evaluate code competency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((c, idx) => {
            const Icon = c.icon;
            return (
              <Card key={idx} hoverEffect className="flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">{c.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Course Curriculum & Weekly Quiz Flow */}
      <section id="curriculum" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <Badge variant="blue" size="sm">Structured Learning</Badge>
            <h2 className="text-3xl font-extrabold text-white mt-3 leading-tight">
              12-Week Modular Curriculum Hierarchy
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              Every course is divided into sequential weekly modules. Each week features comprehensive topics, code examples, and an associated timed MCQ quiz.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Trainer-controlled student course enrollment (No self-enrollment)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Dynamic weekly unlocking and deadline-controlled quiz publishing</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Randomized question and option order with identity-based grading</span>
              </div>
            </div>
            <div className="mt-8">
              <Link to="/admin/login">
                <Button variant="secondary" size="md" icon={Layers}>
                  Explore Curriculum Builder
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-xs font-mono text-cyan-400">COURSE PREVIEW</span>
                <h4 className="text-lg font-bold text-white">Python Full Stack Development</h4>
              </div>
              <Badge variant="emerald">12 Weeks Published</Badge>
            </div>

            <div className="space-y-3">
              {weeksSample.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500 px-2 py-1 rounded bg-slate-900">
                      W{w.week}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">{w.title}</span>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono">{w.questions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Anti-Cheat / Security Deterrents Engine */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl">
            <Badge variant="indigo" size="sm">Assessment Integrity</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
              Anti-Copy & Multi-Tab Deterrents
            </h2>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              KDTechX provides practical browser-level deterrents designed to discourage unauthorized copy/paste, inspection shortcuts, and window switching during active exams.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Lock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Clipboard & Selection Lock</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">user-select none, cut/copy/paste intercept</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Users className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Tab Switch Monitor</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Page Visibility tracking with configurable limits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
