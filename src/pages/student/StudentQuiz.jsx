import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quizService } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import { questionService } from '../../services/questionService';
import { resultService } from '../../services/resultService';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Terminal,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  HelpCircle,
  Menu,
  X,
  Lock,
} from 'lucide-react';

export const StudentQuiz = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error, warning, info } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> selected key

  // Timing state
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const targetEndTimeRef = useRef(null);

  // Security / Anti-Cheat state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [showTabWarningModal, setShowTabWarningModal] = useState(false);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [duplicateTabDetected, setDuplicateTabDetected] = useState(false);

  // UI state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizInitialized, setQuizInitialized] = useState(false);

  // BroadcastChannel for multi-tab check
  const broadcastChannelRef = useRef(null);

  // 1. Initialize Quiz Data & Attempt Recovery (Prompt Section 42)
  useEffect(() => {
    if (!user) return;
    const q = quizService.getQuizById(quizId);
    if (!q) {
      error('Assessment Not Found', 'This quiz does not exist or has been removed.');
      navigate('/student/dashboard');
      return;
    }

    // Role Guard: Course Assignment Check
    if (!(user.courseIds || []).includes(q.courseId)) {
      error('Access Denied', 'You are not assigned to the course associated with this quiz.');
      navigate('/student/dashboard');
      return;
    }

    setQuiz(q);
    const c = courseService.getCourseById(q.courseId);
    setCourse(c);

    // Fetch and optionally randomize questions (Prompt Section 44)
    const allQ = questionService.getAllQuestions();
    let quizQList = allQ.filter((item) => q.questionIds.includes(item.id));

    // Check saved attempt recovery
    const savedAttempt = storageService.getQuizAttempt(quizId, user.id);

    if (savedAttempt && savedAttempt.questions) {
      quizQList = savedAttempt.questions;
      setAnswers(savedAttempt.answers || {});
      setCurrentIndex(savedAttempt.currentIndex || 0);
      setTabViolations(savedAttempt.tabViolations || 0);
      targetEndTimeRef.current = savedAttempt.targetEndTime;
    } else {
      if (q.settings?.randomizeQuestions) {
        quizQList = [...quizQList].sort(() => 0.5 - Math.random());
      }
      if (q.settings?.randomizeOptions) {
        quizQList = quizQList.map((quest) => ({
          ...quest,
          options: [...quest.options].sort(() => 0.5 - Math.random()),
        }));
      }

      // Calculate initial timestamp end time (Prompt Section 38)
      const durationMs = q.durationMinutes * 60 * 1000;
      targetEndTimeRef.current = Date.now() + durationMs;
    }

    setQuestions(quizQList);
    setQuizInitialized(true);

    if (q.settings?.requireFullscreen && !document.fullscreenElement) {
      setShowFullscreenModal(true);
    }
  }, [quizId, user]);

  // 2. Auto-Save Attempt Cache (Prompt Section 42)
  useEffect(() => {
    if (!quizInitialized || !quiz || !user) return;
    storageService.setQuizAttempt(quizId, user.id, {
      questions,
      answers,
      currentIndex,
      targetEndTime: targetEndTimeRef.current,
      tabViolations,
      lastSaved: Date.now(),
    });
  }, [answers, currentIndex, tabViolations, quizInitialized]);

  // 3. Submit Evaluation Function (Deterministic value-based scoring)
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const timeSpent = targetEndTimeRef.current
      ? Math.max(0, Math.round((Date.now() - (targetEndTimeRef.current - quiz.durationMinutes * 60 * 1000)) / 1000))
      : 300;

    try {
      const result = resultService.submitQuizAttempt({
        quizId: quiz.id,
        studentId: user.id,
        answers,
        timeTakenSeconds: timeSpent,
        securityLog: {
          tabSwitches: tabViolations,
          fullscreenExits,
          copyAttempts,
        },
      });

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (e) {
          // ignore
        }
      }

      navigate(`/student/result/${result.id}`);
    } catch (err) {
      error('Submission Error', err.message);
      setIsSubmitting(false);
    }
  }, [isSubmitting, quiz, user, answers, tabViolations, fullscreenExits, copyAttempts, navigate]);

  // 4. Timestamp-based Countdown Timer (Prompt Section 38)
  useEffect(() => {
    if (!targetEndTimeRef.current || !quizInitialized) return;

    const interval = setInterval(() => {
      const remainingMs = targetEndTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setRemainingSeconds(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(interval);
        handleFinalSubmit();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [quizInitialized, handleFinalSubmit]);

  // 5. Anti-Cheat Security Deterrents: Keyboard shortcuts & Clipboard Interception (Prompt Section 39)
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      warning('Security Deterrent', 'Right-click context menu is restricted during the exam.');
    };

    const handleCopy = (e) => {
      e.preventDefault();
      setCopyAttempts((prev) => prev + 1);
      warning('Security Deterrent', 'Text copying is disabled in this assessment.');
    };

    const handleCut = (e) => {
      e.preventDefault();
      warning('Security Deterrent', 'Cut operation is disabled.');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      warning('Security Deterrent', 'Paste operation is restricted.');
    };

    const handleKeyDown = (e) => {
      // Prevent common browser shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        warning('Security Deterrent', `Shortcut Ctrl+${e.key.toUpperCase()} is restricted.`);
        return;
      }
      if (['F12', 'F11'].includes(e.key)) {
        e.preventDefault();
        return;
      }

      // Keyboard shortcuts for option selection: 1-4 or A-D
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optionKeys = ['A', 'B', 'C', 'D'];
        const chosenKey = optionKeys[parseInt(e.key, 10) - 1];
        if (questions[currentIndex]) {
          setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: chosenKey }));
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, questions]);

  // 6. Page Visibility & Tab Switch Detection (Prompt Section 41)
  useEffect(() => {
    if (!quiz?.settings?.tabSwitchDetection || !quizInitialized) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations((prev) => {
          const nextCount = prev + 1;
          setShowTabWarningModal(true);
          const limit = quiz.settings.tabSwitchLimit || 3;
          if (quiz.settings.autoSubmitOnViolations && nextCount >= limit) {
            handleFinalSubmit();
          }
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quiz, quizInitialized, handleFinalSubmit]);

  // 7. Fullscreen tracking (Prompt Section 40)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && quiz?.settings?.requireFullscreen && quizInitialized) {
        setFullscreenExits((prev) => prev + 1);
        setShowFullscreenModal(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [quiz, quizInitialized]);

  // 8. Multiple Tab Collision Detection via BroadcastChannel (Prompt Section 43)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channel = new BroadcastChannel(`kdtechx_exam_${quizId}_${user?.id}`);
      broadcastChannelRef.current = channel;

      channel.postMessage({ type: 'PING' });
      channel.onmessage = (event) => {
        if (event.data?.type === 'PING') {
          channel.postMessage({ type: 'PONG' });
        } else if (event.data?.type === 'PONG') {
          setDuplicateTabDetected(true);
        }
      };

      return () => channel.close();
    }
  }, [quizId, user]);

  const handleEnterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    } catch (e) {
      setShowFullscreenModal(false);
    }
  };

  const handleSelectOption = (key) => {
    if (!questions[currentIndex]) return;
    const currentQId = questions[currentIndex].id;
    setAnswers((prev) => ({
      ...prev,
      [currentQId]: prev[currentQId] === key ? null : key, // toggle
    }));
  };

  if (!quizInitialized || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 gap-3">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading Assessment Environment...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedKey = answers[currentQ?.id];

  // Timer format (mm:ss)
  const formatTimer = (totalSeconds) => {
    if (totalSeconds === null) return '00:00';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isTimerCritical = remainingSeconds !== null && remainingSeconds < 60;
  const isTimerWarning = remainingSeconds !== null && remainingSeconds < 300 && !isTimerCritical;

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none secure-quiz-mode">
      {/* Quiz Header Bar (Prompt Section 36) */}
      <header className="sticky top-0 z-40 h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-white">
              KDTech<span className="text-cyan-400">X</span>
            </span>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <span className="text-[10px] text-cyan-400 font-mono font-bold">
                {course ? course.code : 'EXAM'}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-xs">
                {quiz.title}
              </span>
            </div>
          </div>
        </div>

        {/* Live Timer Countdown Badge (Prompt Section 38) */}
        <div className="flex items-center gap-4">
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs sm:text-sm font-extrabold tracking-wider transition-all ${
              isTimerCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isTimerWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 border-slate-800 text-cyan-400'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimerCritical ? 'text-rose-400 animate-spin' : ''}`} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            className="hidden sm:inline-flex"
          >
            Submit Quiz
          </Button>
        </div>
      </header>

      {/* Main Exam Canvas Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-8">
        {/* Left Area: Active Question Card & Navigation */}
        <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full space-y-6">
          {/* Question Card (Prompt Section 36) */}
          <Card className="p-6 sm:p-8 bg-slate-900/90 border-slate-800 shadow-2xl flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Question {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                </span>
                <Badge variant="slate" size="xs">
                  {currentQ?.topic}
                </Badge>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQ?.question}
              </h2>

              {/* Options Single-Choice Radio Cards (Prompt Section 63 for Mobile Tap Targets) */}
              <div className="space-y-3 pt-2">
                {currentQ?.options?.map((option, optIdx) => {
                  const isSelected = selectedKey === option.key;
                  return (
                    <div
                      key={option.key}
                      onClick={() => handleSelectOption(option.key)}
                      className={`p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                            : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        {option.key}
                      </div>
                      <span className="text-sm font-medium leading-relaxed flex-1">
                        {option.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question Navigation Controls */}
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="md"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <div className="hidden sm:block text-xs text-slate-500 font-mono">
                Auto-saved locally
              </div>

              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  icon={ChevronRight}
                  iconPosition="right"
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsSubmitModalOpen(true)}
                  icon={CheckCircle2}
                >
                  Review & Submit
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Desktop Navigator Sidebar (Prompt Section 37) */}
        <aside className="hidden lg:block w-72 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 h-fit sticky top-24 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Question Navigator
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>

          {/* Navigator Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = currentIndex === idx;

              let style = 'bg-slate-950 border-slate-800 text-slate-500';
              if (isAnswered) style = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold';
              if (isCurrent) style = 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-md shadow-cyan-500/30 scale-105';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl border flex items-center justify-center font-mono text-xs transition-transform cursor-pointer ${style}`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
              <span>Unanswered ({unansweredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-500" />
              <span>Current Question</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full mt-2"
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Submit Assessment
          </Button>
        </aside>
      </div>

      {/* Mobile Drawer Question Navigator (Prompt Section 37) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-end lg:hidden">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Question Navigator
              </h3>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentIndex === idx;

                let style = 'bg-slate-950 border-slate-800 text-slate-500';
                if (isAnswered) style = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold';
                if (isCurrent) style = 'bg-cyan-500 text-slate-950 font-black border-cyan-400';

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setMobileNavOpen(false);
                    }}
                    className={`h-10 rounded-xl border flex items-center justify-center font-mono text-xs ${style}`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-3"
              onClick={() => {
                setMobileNavOpen(false);
                setIsSubmitModalOpen(true);
              }}
            >
              Submit Assessment
            </Button>
          </div>
        </div>
      )}

      {/* Prompt Requirement #40 Fullscreen Exam Mode Dialog */}
      <Modal
        isOpen={showFullscreenModal}
        onClose={() => setShowFullscreenModal(false)}
        title="Secure Quiz Mode"
        subtitle="For the best assessment experience, enter fullscreen mode."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Maximize className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This assessment is configured for fullscreen distraction-free assessment.
            Exiting fullscreen or switching windows will be logged by the trainer.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleEnterFullscreen}
              icon={Maximize}
            >
              Enter Fullscreen Mode
            </Button>
          </div>
        </div>
      </Modal>

      {/* Prompt Requirement #41 Tab Switch Violation Warning Dialog */}
      <Modal
        isOpen={showTabWarningModal}
        onClose={() => setShowTabWarningModal(false)}
        title={`Warning ${tabViolations} / ${quiz.settings?.tabSwitchLimit || 3}`}
        subtitle="You left the quiz window."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Please return to the assessment. All window switches and lost focus events are recorded and visible on the trainer's scorecard.
          </p>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => setShowTabWarningModal(false)}
          >
            I Understand & Return to Quiz
          </Button>
        </div>
      </Modal>

      {/* Multiple Tab Warning (Prompt Section 43) */}
      {duplicateTabDetected && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs shadow-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>Notice: This quiz session was detected as active in another browser tab.</span>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Weekly Assessment?"
        subtitle="Review your submission summary before finalizing."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Questions:</span>
              <strong className="text-white font-mono">{questions.length}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">Answered:</span>
              <strong className="text-emerald-300 font-mono">{answeredCount}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400">Unanswered:</span>
              <strong className="text-amber-300 font-mono">{unansweredCount}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Time Remaining:</span>
              <span className="text-cyan-400 font-mono font-bold">
                {formatTimer(remainingSeconds)}
              </span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <p className="text-xs text-amber-400">
              You still have {unansweredCount} unanswered questions. Are you sure you wish to submit now?
            </p>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Back to Quiz
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
              icon={CheckCircle2}
            >
              Confirm Submission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
