from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminRole
from apps.courses.models import Course
from .models import CourseWeek, Topic
from .serializers import CourseWeekSerializer, TopicSerializer

class CourseCurriculumTreeView(APIView):
    """
    Returns complete structured curriculum tree for a course.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        course = generics.get_object_or_404(Course, pk=course_id)
        weeks = CourseWeek.objects.filter(course=course).prefetch_related('topics', 'quizzes').order_by('week_number')
        serializer = CourseWeekSerializer(weeks, many=True)
        return Response({
            'course': {
                'id': course.id,
                'name': course.name,
                'code': course.code,
                'duration_weeks': course.duration_weeks,
                'status': course.status
            },
            'weeks': serializer.data
        })

class WeekListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseWeekSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        if course_id:
            return CourseWeek.objects.filter(course_id=course_id).order_by('week_number')
        return CourseWeek.objects.all().order_by('week_number')

class WeekDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CourseWeek.objects.all()
    serializer_class = CourseWeekSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [IsAuthenticated()]

class TopicListCreateView(generics.ListCreateAPIView):
    serializer_class = TopicSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        week_id = self.request.query_params.get('week')
        if week_id:
            return Topic.objects.filter(week_id=week_id).order_by('order')
        return Topic.objects.all().order_by('order')

class TopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
