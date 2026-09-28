import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import { questionService } from '../../services/questionService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  Clock,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  Trash2,
} from 'lucide-react';

export const QuizDetail = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const loadData = () => {
    const q = quizService.getQuizById(quizId);
    if (q) {
      setQuiz(q);
      const c = courseService.getCourseById(q.courseId);
      setCourse(c);
      const allQ = questionService.getAllQuestions();
      setQuestions(allQ.filter((item) => q.questionIds.includes(item.id)));
      if (c) {
        setAssignedStudents(courseService.getAssignedStudents(c.id));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  if (!quiz) {
    return (
      <div className="p-8 text-center text-slate-400">
        Quiz not found. <Link to="/admin/quizzes" className="text-cyan-400">Return to Quizzes</Link>
      </div>
    );
  }

  const handlePublishConfirm = () => {
    quizService.publishQuiz(quiz.id);
    success('Quiz Published', `"${quiz.title}" is now visible to all assigned students.`);
    setIsPublishModalOpen(false);
    loadData();
  };

  const handleUnpublish = () => {
    quizService.unpublishQuiz(quiz.id);
    success('Quiz Unpublished', `"${quiz.title}" moved to draft status.`);
    loadData();
  };

  const isPublished = quiz.status === 'published';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/quizzes"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                {course ? course.code : 'Assessment'}
              </span>
              <Badge variant={isPublished ? 'emerald' : 'slate'} size="xs">
                {quiz.status}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{quiz.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPublished ? (
            <Button variant="secondary" size="sm" onClick={handleUnpublish} icon={XCircle}>
              Unpublish
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
              icon={CheckCircle2}
            >
              Publish Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Overview Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800 text-center">
          <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration</span>
          <strong className="text-base text-white">{quiz.durationMinutes} Minutes</strong>
        </Card>
        <Card className="p-4 bg-slate-900/80 border-slate-800 text-center">
          <HelpCircle className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Questions</span>
          <strong className="text-base text-white">{quiz.questionIds?.length || 0} MCQs</strong>
        </Card>
        <Card className="p-4 bg-slate-900/80 border-slate-800 text-center">
          <Award className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Marks</span>
          <strong className="text-base text-white">
            {quiz.totalMarks} ({quiz.passPercentage}% Pass)
          </strong>
        </Card>
        <Card className="p-4 bg-slate-900/80 border-slate-800 text-center">
          <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Eligible Learners</span>
          <strong className="text-base text-white">{assignedStudents.length} Students</strong>
        </Card>
      </div>

      {/* Security Policies Summary */}
      <Card className="p-5 bg-slate-900/70 border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Enforced Assessment Policies
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Fullscreen: {quiz.settings?.requireFullscreen ? '✓ Required' : '✗ Optional'}
          </span>
          <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Tab Warnings: {quiz.settings?.tabSwitchDetection ? `✓ Max ${quiz.settings.tabSwitchLimit}` : '✗ Disabled'}
          </span>
          <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Randomize Questions: {quiz.settings?.randomizeQuestions ? '✓ Enabled' : '✗ Disabled'}
          </span>
          <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Randomize Choices: {quiz.settings?.randomizeOptions ? '✓ Enabled' : '✗ Disabled'}
          </span>
          <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Immediate Scorecard: {quiz.settings?.showScoreImmediate ? '✓ Enabled' : '✗ Disabled'}
          </span>
          <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Answer Review: {quiz.settings?.showAnswerReview ? '✓ Enabled' : '✗ Disabled'}
          </span>
        </div>
      </Card>

      {/* Questions Preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Included Assessment Questions ({questions.length})
        </h3>
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <Card key={q.id} className="p-4 bg-slate-900/60 border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-400 font-bold">Q{String(idx + 1).padStart(2, '0')}.</span>
                <Badge variant="slate" size="xs">
                  {q.topic}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options.map((opt) => (
                  <div
                    key={opt.key}
                    className={`p-2 rounded-lg border flex items-center gap-2 ${
                      opt.key === q.correctAnswer
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold font-mono">{opt.key}.</span>
                    <span>{opt.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Prompt Requirement #32 Publishing Confirmation Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publish Weekly Assessment?"
        subtitle="Confirm assessment details before releasing to assigned learners."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-300 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Course:</span>
              <strong className="text-white font-sans text-sm">{course?.name}</strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Week:</span>
                <span className="text-cyan-400 font-bold">{quiz.weekId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Questions:</span>
                <span className="text-white font-bold">{quiz.questionIds?.length} MCQs</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Duration:</span>
                <span className="text-white">{quiz.durationMinutes} Minutes</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Eligible Students:</span>
                <span className="text-emerald-400 font-bold">{assignedStudents.length} Assigned</span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Deadline:</span>
              <span className="text-amber-400">{new Date(quiz.deadline).toLocaleDateString()}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Only students assigned to <strong>{course?.name}</strong> will be granted access to this quiz.
          </p>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handlePublishConfirm} icon={CheckCircle2}>
              Publish Assessment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
