import csv
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from apps.accounts.permissions import IsAdminRole
from apps.attempts.models import QuizAttempt
from apps.attempts.serializers import QuizResultScorecardSerializer

class ResultListView(generics.ListAPIView):
    serializer_class = QuizResultScorecardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = QuizAttempt.objects.filter(
            status=QuizAttempt.Status.SUBMITTED
        ).select_related(
            'quiz__course',
            'student__user',
            'student__batch'
        ).prefetch_related(
            'question_snapshots__question',
            'question_snapshots__answer'
        ).order_by('-submitted_at')

        if not user.is_admin_user:
            if hasattr(user, 'student_profile'):
                return queryset.filter(student=user.student_profile)
            return QuizAttempt.objects.none()

        # Admin filters
        quiz_id = self.request.query_params.get('quiz')
        course_id = self.request.query_params.get('course')
        batch_id = self.request.query_params.get('batch')
        student_id = self.request.query_params.get('student')
        is_passed = self.request.query_params.get('is_passed')

        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        if course_id:
            queryset = queryset.filter(quiz__course_id=course_id)
        if batch_id:
            queryset = queryset.filter(student__batch_id=batch_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if is_passed is not None:
            queryset = queryset.filter(is_passed=is_passed.lower() == 'true')

        return queryset

class ResultDetailView(generics.RetrieveAPIView):
    serializer_class = QuizResultScorecardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = QuizAttempt.objects.select_related(
            'quiz__course',
            'student__user',
            'student__batch'
        ).prefetch_related(
            'question_snapshots__question',
            'question_snapshots__answer'
        )

        if user.is_admin_user:
            return queryset
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        return QuizAttempt.objects.none()

class ResultExportView(APIView):
    """
    Exports assessment results to CSV.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        queryset = QuizAttempt.objects.filter(
            status=QuizAttempt.Status.SUBMITTED
        ).select_related(
            'quiz__course',
            'student__user',
            'student__batch'
        ).order_by('-submitted_at')

        quiz_id = request.query_params.get('quiz')
        course_id = request.query_params.get('course')
        batch_id = request.query_params.get('batch')

        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        if course_id:
            queryset = queryset.filter(quiz__course_id=course_id)
        if batch_id:
            queryset = queryset.filter(student__batch_id=batch_id)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="kdtechx_assessment_results.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Attempt ID', 'Student ID', 'Student Name', 'Batch',
            'Course', 'Quiz Title', 'Score', 'Total Marks',
            'Percentage', 'Result', 'Correct', 'Wrong', 'Unanswered',
            'Time Taken (s)', 'Tab Violations', 'Submitted At'
        ])

        for att in queryset:
            student_name = att.student.user.get_full_name() or att.student.user.username
            batch_name = att.student.batch.name if att.student.batch else 'None'
            writer.writerow([
                att.id,
                att.student.student_id,
                student_name,
                batch_name,
                att.quiz.course.name,
                att.quiz.title,
                att.score,
                att.quiz.total_marks,
                f"{att.percentage}%",
                'PASSED' if att.is_passed else 'FAILED',
                att.correct_count,
                att.wrong_count,
                att.unanswered_count,
                att.time_taken_seconds,
                att.tab_violations,
                att.submitted_at.strftime('%Y-%m-%d %H:%M:%S UTC') if att.submitted_at else ''
            ])

        return response
