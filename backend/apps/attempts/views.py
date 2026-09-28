import random
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Max
from apps.quizzes.models import Quiz, QuizQuestion
from apps.courses.models import CourseEnrollment
from apps.audit.models import SecurityEvent
from .models import QuizAttempt, AttemptQuestion, AttemptAnswer
from .serializers import ActiveAttemptSerializer, QuizResultScorecardSerializer
from .evaluation import evaluate_quiz_attempt

class StartQuizAttemptView(APIView):
    """
    Server-authoritative quiz start and attempt snapshot initialization.
    Guarantees that refreshing the page never changes questions or restarts timer.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        user = request.user
        if not hasattr(user, 'student_profile'):
            return Response(
                {'error': 'Administrative accounts cannot initiate student exam attempts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student = user.student_profile
        quiz = generics.get_object_or_404(Quiz, pk=quiz_id)

        # 1. Verify Course Enrollment
        is_enrolled = CourseEnrollment.objects.filter(
            course=quiz.course,
            student=student
        ).exists()
        if not is_enrolled:
            return Response(
                {'error': 'You are not enrolled in the course associated with this assessment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Verify Status
        if quiz.status.lower() != Quiz.Status.PUBLISHED.value.lower():
            return Response(
                {'error': 'This assessment is not currently published.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()

        # 3. Check for existing in-progress attempt to recover
        active_attempt = QuizAttempt.objects.filter(
            quiz=quiz,
            student=student,
            status=QuizAttempt.Status.IN_PROGRESS
        ).first()

        if active_attempt:
            # If active attempt has not timed out, return it
            if active_attempt.deadline_at > now:
                serializer = ActiveAttemptSerializer(active_attempt, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # Expired while candidate was away -> evaluate saved answers
                active_attempt.status = QuizAttempt.Status.TIMED_OUT
                active_attempt.save()

        # 4. Check Maximum Attempts Limit
        past_attempts_count = QuizAttempt.objects.filter(
            quiz=quiz,
            student=student
        ).count()

        if past_attempts_count >= quiz.max_attempts:
            return Response(
                {'error': f'You have reached the maximum allowed attempts ({quiz.max_attempts}) for this quiz.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Check Availability Window
        if now < quiz.start_at:
            return Response(
                {'error': f"This quiz is scheduled to open at {quiz.start_at.strftime('%Y-%m-%d %H:%M:%S UTC')}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if now > quiz.deadline:
            return Response(
                {'error': 'The deadline for this assessment has passed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6. Initialize New Attempt and Snapshot Atomically
        next_attempt_number = past_attempts_count + 1
        duration_delta = timedelta(minutes=quiz.duration_minutes)
        # Server deadline is whichever is earlier: started_at + duration or quiz global deadline
        computed_deadline = min(now + duration_delta, quiz.deadline)

        quiz_questions = list(
            QuizQuestion.objects.filter(quiz=quiz)
            .select_related('question')
            .order_by('order')
        )

        if not quiz_questions:
            return Response(
                {'error': 'Assessment does not have any questions configured.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quiz.random_questions:
            random.shuffle(quiz_questions)

        with transaction.atomic():
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                student=student,
                attempt_number=next_attempt_number,
                deadline_at=computed_deadline,
                status=QuizAttempt.Status.IN_PROGRESS
            )

            snapshots = []
            for idx, qq in enumerate(quiz_questions, start=1):
                option_mapping = {}
                if quiz.random_options:
                    keys = ['A', 'B', 'C', 'D']
                    shuffled = list(keys)
                    random.shuffle(shuffled)
                    # Candidate sees shuffled[i] for choice keys[i]
                    option_mapping = {keys[i]: shuffled[i] for i in range(4)}

                snapshots.append(
                    AttemptQuestion(
                        attempt=attempt,
                        question=qq.question,
                        display_order=idx,
                        option_mapping=option_mapping
                    )
                )

            AttemptQuestion.objects.bulk_create(snapshots)

        serializer = ActiveAttemptSerializer(attempt, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ActiveAttemptView(APIView):
    """
    Returns existing in-progress attempt if candidate is currently taking this quiz.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        if not hasattr(request.user, 'student_profile'):
            return Response({'active': False})

        attempt = QuizAttempt.objects.filter(
            quiz_id=quiz_id,
            student=request.user.student_profile,
            status=QuizAttempt.Status.IN_PROGRESS
        ).first()

        if attempt:
            if attempt.deadline_at > timezone.now():
                serializer = ActiveAttemptSerializer(attempt, context={'request': request})
                return Response({'active': True, 'attempt': serializer.data})
            else:
                attempt.status = QuizAttempt.Status.TIMED_OUT
                attempt.save()

        return Response({'active': False})

class SaveAnswerProgressiveView(APIView):
    """
    Progressively auto-saves selected answer for a snapshot question.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        attempt = generics.get_object_or_404(
            QuizAttempt,
            pk=attempt_id,
            student__user=request.user,
            status=QuizAttempt.Status.IN_PROGRESS
        )

        if timezone.now() > attempt.deadline_at + timedelta(seconds=15):
            attempt.status = QuizAttempt.Status.TIMED_OUT
            attempt.save()
            return Response({'error': 'Assessment time has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        snapshot_id = request.data.get('snapshot_id')
        selected_option = request.data.get('selected_option')

        snapshot = generics.get_object_or_404(AttemptQuestion, pk=snapshot_id, attempt=attempt)

        AttemptAnswer.objects.update_or_create(
            attempt_question=snapshot,
            defaults={'selected_option': selected_option}
        )

        return Response({'saved': True, 'snapshot_id': snapshot_id, 'selected_option': selected_option})

class SecurityEventRecordView(APIView):
    """
    Records browser-level security deterrent violations (tab switches, exits).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        attempt = generics.get_object_or_404(
            QuizAttempt,
            pk=attempt_id,
            student__user=request.user
        )

        event_type = request.data.get('event_type', 'TAB_SWITCH')
        details = request.data.get('details', {})

        if event_type == 'TAB_SWITCH':
            attempt.tab_violations += 1
            attempt.save(update_fields=['tab_violations'])

        SecurityEvent.objects.create(
            attempt=attempt,
            event_type=event_type,
            metadata=details
        )

        return Response({
            'recorded': True,
            'violations_count': attempt.tab_violations,
            'limit': attempt.quiz.tab_warning_limit
        })

class SubmitQuizAttemptView(APIView):
    """
    Finalizes assessment attempt, executes deterministic server-side evaluation,
    computes scores, and returns scorecard.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        attempt = generics.get_object_or_404(
            QuizAttempt,
            pk=attempt_id,
            student__user=request.user
        )

        # Idempotency check: if already submitted, return existing scorecard
        if attempt.status == QuizAttempt.Status.SUBMITTED:
            serializer = QuizResultScorecardSerializer(attempt, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Submitted answers dict: { snapshot_id: selected_option }
        answers_dict = request.data.get('answers', {})
        if isinstance(answers_dict, list):
            # Convert list of { snapshot_id/question_id, selected_option } to dict
            transformed = {}
            for item in answers_dict:
                sid = item.get('snapshot_id') or item.get('question_id')
                if sid:
                    transformed[sid] = item.get('selected_option') or item.get('selected_answer')
            answers_dict = transformed

        evaluated_attempt = evaluate_quiz_attempt(attempt, answers_dict)
        serializer = QuizResultScorecardSerializer(evaluated_attempt, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
