from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.courses.models import Course, CourseEnrollment
from apps.curriculum.models import CourseWeek, Topic
from apps.questions.models import Question
from apps.quizzes.models import Quiz, QuizQuestion
from apps.attempts.models import QuizAttempt
from apps.batches.models import Batch
from apps.students.models import StudentProfile

User = get_user_model()

class QuizEngineEvaluationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin_eval',
            email='admin@kdtechx.com',
            password='AdminPass123!',
            role='ADMIN'
        )
        self.batch = Batch.objects.create(name='Batch Beta', code='BB1', status='active')
        self.student = User.objects.create_user(
            username='student_eval',
            email='student@kdtechx.com',
            password='StudentPass123!',
            role='STUDENT'
        )
        self.profile = StudentProfile.objects.create(
            user=self.student,
            student_id='EVAL001',
            batch=self.batch
        )
        self.course = Course.objects.create(
            name='Algorithms & Data Structures',
            code='CS201',
            status='PUBLISHED',
            created_by=self.admin
        )
        CourseEnrollment.objects.create(
            student=self.profile,
            course=self.course,
            assigned_by=self.admin
        )
        self.week = CourseWeek.objects.create(course=self.course, week_number=1, title='Complexity')
        self.topic = Topic.objects.create(week=self.week, title='Big-O', order=1)

        # Create 3 questions (marks: 2, 2, 2) = 6 total marks
        self.q1 = Question.objects.create(
            course=self.course,
            topic=self.topic,
            question_text='Binary search time complexity?',
            option_a='O(1)', option_b='O(n)', option_c='O(log n)', option_d='O(n^2)',
            correct_answer='C',
            marks=2,
            created_by=self.admin
        )
        self.q2 = Question.objects.create(
            course=self.course,
            topic=self.topic,
            question_text='Merge sort worst case time complexity?',
            option_a='O(n log n)', option_b='O(n)', option_c='O(n^2)', option_d='O(log n)',
            correct_answer='A',
            marks=2,
            created_by=self.admin
        )
        self.q3 = Question.objects.create(
            course=self.course,
            topic=self.topic,
            question_text='Hash table average lookup complexity?',
            option_a='O(n)', option_b='O(1)', option_c='O(log n)', option_d='O(n log n)',
            correct_answer='B',
            marks=2,
            created_by=self.admin
        )

        now = timezone.now()
        self.quiz = Quiz.objects.create(
            course=self.course,
            week=self.week,
            title='Complexity Assessment',
            duration_minutes=20,
            total_marks=6.00,
            pass_percentage=60.0,
            negative_marking=True,
            negative_marks=0.5,
            start_at=now - timedelta(hours=1),
            deadline=now + timedelta(days=7),
            status='PUBLISHED',
            created_by=self.admin
        )
        QuizQuestion.objects.create(quiz=self.quiz, question=self.q1, order=1, marks=2)
        QuizQuestion.objects.create(quiz=self.quiz, question=self.q2, order=2, marks=2)
        QuizQuestion.objects.create(quiz=self.quiz, question=self.q3, order=3, marks=2)

    def test_complete_quiz_lifecycle_and_mathematical_evaluation(self):
        self.client.force_authenticate(user=self.student)

        # 1. Start quiz attempt
        start_res = self.client.post(f'/api/attempts/quiz/{self.quiz.id}/start/')
        self.assertEqual(start_res.status_code, status.HTTP_201_CREATED)
        attempt_id = start_res.data['attempt_id']
        questions = start_res.data['questions']
        self.assertEqual(len(questions), 3)

        snap1 = questions[0]['snapshot_id']
        snap2 = questions[1]['snapshot_id']

        # 2. Save incremental answers
        # Q1: Correct ('C') -> +2
        # Q2: Wrong ('C' instead of 'A') -> -0.5
        # Q3: Unanswered -> 0
        save_res1 = self.client.post(f'/api/attempts/{attempt_id}/save-answer/', {
            'snapshot_id': snap1,
            'selected_option': 'C'
        })
        self.assertEqual(save_res1.status_code, status.HTTP_200_OK)

        save_res2 = self.client.post(f'/api/attempts/{attempt_id}/save-answer/', {
            'snapshot_id': snap2,
            'selected_option': 'C'
        })
        self.assertEqual(save_res2.status_code, status.HTTP_200_OK)

        # 3. Log security event (tab switch)
        sec_res = self.client.post(f'/api/attempts/{attempt_id}/security-event/', {
            'event_type': 'TAB_SWITCH',
            'details': {'screen': 'blur'}
        }, format='json')
        self.assertEqual(sec_res.status_code, status.HTTP_200_OK)

        # 4. Final Submission
        submit_res = self.client.post(f'/api/attempts/{attempt_id}/submit/', {
            'answers': [
                {'snapshot_id': snap1, 'selected_option': 'C'},
                {'snapshot_id': snap2, 'selected_option': 'C'},
            ]
        }, format='json')
        self.assertEqual(submit_res.status_code, status.HTTP_200_OK)
        data = submit_res.data

        # Server-authoritative calculations:
        # Total marks possible = 6 (2 + 2 + 2)
        # Correct count = 1 (Q1), Marks = +2.0
        # Wrong count = 1 (Q2), Penalty = -0.5 (negative_marks)
        # Unanswered = 1 (Q3), Marks = 0.0
        # Final Score = 2.0 - 0.5 = 1.5
        # Percentage = (1.5 / 6.0) * 100 = 25.0%
        # Pass threshold = 60.0% => is_passed = False
        self.assertEqual(data['status'], 'SUBMITTED')
        self.assertEqual(data['correct_count'], 1)
        self.assertEqual(data['wrong_count'], 1)
        self.assertEqual(data['unanswered_count'], 1)
        self.assertAlmostEqual(float(data['score']), 1.5, places=2)
        self.assertAlmostEqual(float(data['percentage']), 25.0, places=2)
        self.assertFalse(data['is_passed'])

        # 5. Idempotent submission: re-submitting returns existing evaluated scorecard without altering score
        resubmit = self.client.post(f'/api/attempts/{attempt_id}/submit/', {'answers': []}, format='json')
        self.assertEqual(resubmit.status_code, status.HTTP_200_OK)
        self.assertEqual(resubmit.data['status'], 'SUBMITTED')
        self.assertAlmostEqual(float(resubmit.data['score']), 1.5, places=2)
