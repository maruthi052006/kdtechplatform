import csv
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.http import HttpResponse
from django.db.models import Q
from apps.accounts.permissions import IsAdminRole
from apps.courses.models import Course
from apps.curriculum.models import Topic
from .models import Question
from .serializers import QuestionAdminSerializer
from .excel_handler import parse_and_validate_file

class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionAdminSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = Question.objects.select_related('course', 'topic', 'created_by').all()
        course_id = self.request.query_params.get('course')
        topic_id = self.request.query_params.get('topic')
        difficulty = self.request.query_params.get('difficulty')
        search = self.request.query_params.get('search')

        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if topic_id:
            queryset = queryset.filter(topic_id=topic_id)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if search:
            queryset = queryset.filter(
                Q(question_text__icontains=search) |
                Q(option_a__icontains=search) |
                Q(option_b__icontains=search) |
                Q(option_c__icontains=search) |
                Q(option_d__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.select_related('course', 'topic').all()
    serializer_class = QuestionAdminSerializer
    permission_classes = [IsAdminRole]

class QuestionExcelValidateView(APIView):
    """
    Validates uploaded Excel or CSV file without persisting.
    Returns preview and detailed validation error reports.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminRole]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce maximum file size (5MB)
        if uploaded_file.size > 5 * 1024 * 1024:
            return Response({'error': 'File exceeds maximum upload size of 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        validation_result = parse_and_validate_file(uploaded_file, uploaded_file.name)
        return Response(validation_result)

class QuestionExcelCommitView(APIView):
    """
    Atomically commits validated spreadsheet items into PostgreSQL.
    """
    permission_classes = [IsAdminRole]

    def post(self, request):
        course_id = request.data.get('course_id')
        rows = request.data.get('rows', [])

        if not course_id:
            return Response({'error': 'course_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not rows:
            return Response({'error': 'No questions to import.'}, status=status.HTTP_400_BAD_REQUEST)

        course = generics.get_object_or_404(Course, pk=course_id)

        created_questions = []
        with transaction.atomic():
            for row in rows:
                topic_name = row.get('topic_name', 'General')
                topic = Topic.objects.filter(
                    week__course=course,
                    title__iexact=topic_name
                ).first()

                q = Question(
                    course=course,
                    topic=topic,
                    topic_name=topic_name,
                    question_text=row['question_text'],
                    option_a=row['option_a'],
                    option_b=row['option_b'],
                    option_c=row['option_c'],
                    option_d=row['option_d'],
                    correct_answer=row['correct_answer'],
                    difficulty=row.get('difficulty', 'medium'),
                    explanation=row.get('explanation', ''),
                    marks=row.get('marks', 1.00),
                    created_by=request.user
                )
                created_questions.append(q)

            Question.objects.bulk_create(created_questions)

        return Response({
            'success': True,
            'imported_count': len(created_questions),
            'message': f'Successfully imported {len(created_questions)} questions into {course.name}.'
        }, status=status.HTTP_201_CREATED)

class QuestionExportView(APIView):
    """
    Exports question bank to CSV format.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        course_id = request.query_params.get('course_id')
        queryset = Question.objects.all()
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="kdtechx_question_bank.csv"'

        writer = csv.writer(response)
        writer.writerow(['id', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'answer', 'topic', 'difficulty', 'explanation', 'marks'])

        for q in queryset:
            topic_str = q.topic.title if q.topic else (q.topic_name or 'General')
            writer.writerow([
                q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
                q.correct_answer, topic_str, q.difficulty, q.explanation or '', q.marks
            ])

        return response
