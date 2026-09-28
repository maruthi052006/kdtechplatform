import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CourseCurriculum = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [expandedWeekId, setExpandedWeekId] = useState(null);

  // Add Topic Modal state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [activeWeekId, setActiveWeekId] = useState(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDuration, setTopicDuration] = useState('45');

  const { success, error } = useToast();

  const loadData = () => {
    const c = courseService.getCourseById(courseId);
    if (c) {
      setCourse(c);
      const curriculum = courseService.getCurriculum(courseId);
      setWeeks(curriculum);
      if (curriculum.length > 0 && !expandedWeekId) {
        setExpandedWeekId(curriculum[0].id);
      }
    }
    setQuizzes(quizService.getAllQuizzes());
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleAddWeek = () => {
    try {
      const newWeek = courseService.addWeek(courseId, {
        title: `Week ${String(weeks.length + 1).padStart(2, '0')}: New Engineering Module`,
        description: 'Module objectives and hands-on laboratory exercises.',
        topics: [{ id: `top_${Date.now()}`, title: 'Module Overview & Lab Exercise', durationMinutes: 45 }],
      });
      success('Week Added', `Week ${newWeek.weekNumber} added to curriculum.`);
      loadData();
      setExpandedWeekId(newWeek.id);
    } catch (err) {
      error('Failed to add week', err.message);
    }
  };

  const handleDeleteWeek = (weekId, weekNumber) => {
    if (window.confirm(`Delete Week ${weekNumber} from curriculum?`)) {
      courseService.deleteWeek(weekId);
      success('Week Deleted', `Week ${weekNumber} removed.`);
      loadData();
    }
  };

  const handleOpenTopicModal = (weekId) => {
    setActiveWeekId(weekId);
    setTopicTitle('');
    setTopicDuration('45');
    setIsTopicModalOpen(true);
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!topicTitle.trim()) {
      error('Validation Error', 'Topic title is required.');
      return;
    }
    try {
      courseService.addTopicToWeek(activeWeekId, {
        title: topicTitle,
        durationMinutes: parseInt(topicDuration, 10) || 45,
      });
      success('Topic Added', 'New topic added to weekly syllabus.');
      setIsTopicModalOpen(false);
      loadData();
    } catch (err) {
      error('Error', err.message);
    }
  };

  const handleDeleteTopic = (weekId, topicId) => {
    courseService.deleteTopicFromWeek(weekId, topicId);
    success('Topic Removed', 'Topic removed from week.');
    loadData();
  };

  if (!course) {
    return (
      <div className="p-8 text-center text-slate-400">
        Course not found. <Link to="/admin/courses" className="text-cyan-400 underline">Return to Courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                {course.code}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{course.name}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Curriculum & Weekly Module Architecture</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/admin/courses/${course.id}/students`}>
            <Button size="sm" variant="secondary">
              Assigned Students
            </Button>
          </Link>
          <Button size="sm" variant="primary" icon={Plus} onClick={handleAddWeek}>
            Add Week
          </Button>
        </div>
      </div>

      {/* Curriculum Weeks Accordion List */}
      <div className="space-y-4">
        {weeks.map((week) => {
          const isExpanded = expandedWeekId === week.id;
          const linkedQuiz = quizzes.find((q) => q.id === week.quizId || (q.courseId === course.id && q.weekId === week.id));

          return (
            <Card key={week.id} className="p-0 overflow-hidden border-slate-800 bg-slate-900/70">
              {/* Header Bar */}
              <div
                onClick={() => setExpandedWeekId(isExpanded ? null : week.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono font-extrabold px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Week {String(week.weekNumber).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {week.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{week.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {linkedQuiz ? (
                    <Badge variant="emerald" size="xs">
                      Quiz Linked
                    </Badge>
                  ) : (
                    <Badge variant="amber" size="xs">
                      No Quiz
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-5 bg-slate-950/40">
                  {/* Topics List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Topics Covered ({week.topics?.length || 0})
                      </h4>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                        onClick={() => handleOpenTopicModal(week.id)}
                      >
                        Add Topic
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {week.topics?.map((topic, tIdx) => (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-mono">0{tIdx + 1}.</span>
                            <span className="font-semibold text-slate-200">{topic.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              {topic.durationMinutes} mins
                            </span>
                            <button
                              onClick={() => handleDeleteTopic(week.id, topic.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Associated Assessment Section */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Weekly MCQ Quiz
                        </h4>
                        {linkedQuiz ? (
                          <p className="text-sm font-semibold text-cyan-300 mt-0.5">
                            {linkedQuiz.title} ({linkedQuiz.questionIds?.length} Questions • {linkedQuiz.durationMinutes}m)
                          </p>
                        ) : (
                          <p className="text-xs text-amber-400 mt-0.5">
                            No quiz has been generated or linked for Week {week.weekNumber} yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {linkedQuiz ? (
                        <Link to={`/admin/quizzes/${linkedQuiz.id}`}>
                          <Button size="sm" variant="secondary">
                            Configure Quiz
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/admin/quizzes/create?courseId=${course.id}&weekId=${week.id}`}>
                          <Button size="sm" variant="primary" icon={Plus}>
                            Build Week Quiz
                          </Button>
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteWeek(week.id, week.weekNumber)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl"
                        title="Delete Week"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title="Add Curriculum Topic"
        subtitle="Specify topic title and estimated classroom/video duration."
      >
        <form onSubmit={handleAddTopic} className="space-y-4">
          <Input
            label="Topic Title *"
            placeholder="e.g. Higher-Order Functions & Lambda Closures"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            autoFocus
          />
          <Input
            label="Duration (Minutes)"
            type="number"
            min="10"
            max="180"
            value={topicDuration}
            onChange={(e) => setTopicDuration(e.target.value)}
          />
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsTopicModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Topic
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
