from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.accounts.permissions import IsAdminRole
from .models import Quiz
from .serializers import QuizSummarySerializer, QuizDetailSerializer

class QuizListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuizDetailSerializer
        return QuizSummarySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Quiz.objects.select_related('course', 'week').prefetch_related('quiz_questions').all()

        if user.is_admin_user:
            course_id = self.request.query_params.get('course')
            status_param = self.request.query_params.get('status')
            if course_id:
                queryset = queryset.filter(course_id=course_id)
            if status_param:
                queryset = queryset.filter(status=status_param)
            return queryset

        # For student: only published quizzes belonging to their enrolled courses
        if hasattr(user, 'student_profile'):
            return queryset.filter(
                course__enrollments__student=user.student_profile,
                status=Quiz.Status.PUBLISHED
            ).distinct()

        return Quiz.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.select_related('course', 'week').prefetch_related('quiz_questions__question').all()
    serializer_class = QuizDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [IsAuthenticated()]

class QuizPublishView(APIView):
    """
    Toggles or sets status of quiz to PUBLISHED.
    """
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        quiz = generics.get_object_or_404(Quiz, pk=pk)
        
        # Validation before publishing
        if quiz.quiz_questions.count() == 0:
            return Response(
                {'error': 'Cannot publish an assessment with zero questions.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        quiz.status = Quiz.Status.PUBLISHED
        quiz.save()
        return Response({
            'success': True,
            'message': f"Assessment '{quiz.title}' is now published and accessible to enrolled students.",
            'status': quiz.status
        })
