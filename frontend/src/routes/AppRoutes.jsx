import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { StudentLayout } from '../layouts/StudentLayout';

// Role Guards
import { AdminRoute, StudentRoute } from './Guards';

// Public & Auth Pages
import { LandingPage } from '../pages/public/LandingPage';
import { AdminLogin } from '../pages/auth/AdminLogin';
import { StudentLogin } from '../pages/auth/StudentLogin';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { CourseManagement } from '../pages/admin/CourseManagement';
import { CourseCreate } from '../pages/admin/CourseCreate';
import { CourseCurriculum } from '../pages/admin/CourseCurriculum';
import { CourseStudents } from '../pages/admin/CourseStudents';
import { StudentManagement } from '../pages/admin/StudentManagement';
import { StudentCreate } from '../pages/admin/StudentCreate';
import { BatchManagement } from '../pages/admin/BatchManagement';
import { QuestionBank } from '../pages/admin/QuestionBank';
import { QuestionImport } from '../pages/admin/QuestionImport';
import { QuizManagement } from '../pages/admin/QuizManagement';
import { QuizCreate } from '../pages/admin/QuizCreate';
import { QuizDetail } from '../pages/admin/QuizDetail';
import { ResultsOverview } from '../pages/admin/ResultsOverview';
import { AnalyticsPage } from '../pages/admin/AnalyticsPage';
import { AnnouncementsPage } from '../pages/admin/AnnouncementsPage';
import { AdminSettings } from '../pages/admin/AdminSettings';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentCourses } from '../pages/student/StudentCourses';
import { StudentCourseView } from '../pages/student/StudentCourseView';
import { StudentQuiz } from '../pages/student/StudentQuiz';
import { StudentResult } from '../pages/student/StudentResult';
import { StudentHistory } from '../pages/student/StudentHistory';
import { StudentProgress } from '../pages/student/StudentProgress';
import { StudentProfile } from '../pages/student/StudentProfile';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth Screens */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/student/login" element={<StudentLogin />} />

      {/* Admin Portal (Protected) */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<CourseManagement />} />
          <Route path="/admin/courses/create" element={<CourseCreate />} />
          <Route path="/admin/courses/:courseId/curriculum" element={<CourseCurriculum />} />
          <Route path="/admin/courses/:courseId/students" element={<CourseStudents />} />
          <Route path="/admin/students" element={<StudentManagement />} />
          <Route path="/admin/students/create" element={<StudentCreate />} />
          <Route path="/admin/batches" element={<BatchManagement />} />
          <Route path="/admin/questions" element={<QuestionBank />} />
          <Route path="/admin/questions/import" element={<QuestionImport />} />
          <Route path="/admin/quizzes" element={<QuizManagement />} />
          <Route path="/admin/quizzes/create" element={<QuizCreate />} />
          <Route path="/admin/quizzes/:quizId" element={<QuizDetail />} />
          <Route path="/admin/results" element={<ResultsOverview />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/announcements" element={<AnnouncementsPage />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Student Portal (Protected) */}
      <Route element={<StudentRoute />}>
        {/* Distraction-Free Exam Engine (Standalone Fullscreen layout) */}
        <Route path="/student/quiz/:quizId" element={<StudentQuiz />} />

        {/* Standard Student Portal Layout */}
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/courses/:courseId" element={<StudentCourseView />} />
          <Route path="/student/result/:resultId" element={<StudentResult />} />
          <Route path="/student/history" element={<StudentHistory />} />
          <Route path="/student/progress" element={<StudentProgress />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
