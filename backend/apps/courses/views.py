from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminRole
from .models import Course, CourseEnrollment
from .serializers import CourseSerializer, CourseEnrollmentSerializer
from apps.students.models import StudentProfile

class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            queryset = Course.objects.all()
            status_param = self.request.query_params.get('status')
            category_param = self.request.query_params.get('category')
            if status_param:
                queryset = queryset.filter(status=status_param)
            if category_param:
                queryset = queryset.filter(category=category_param)
            return queryset
        
        # Student sees only enrolled published courses
        if hasattr(user, 'student_profile'):
            return Course.objects.filter(
                enrollments__student=user.student_profile,
                status=Course.Status.PUBLISHED
            ).distinct()
        return Course.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [IsAuthenticated()]

class CourseStudentsView(APIView):
    """
    Lists students enrolled in a course or enrolls students.
    """
    def get_permissions(self):
        return [IsAdminRole()]

    def get(self, request, pk):
        course = generics.get_object_or_404(Course, pk=pk)
        enrollments = CourseEnrollment.objects.filter(course=course).select_related('student__user', 'student__batch')
        serializer = CourseEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        course = generics.get_object_or_404(Course, pk=pk)
        student_ids = request.data.get('student_ids', [])
        
        created_count = 0
        for sid in student_ids:
            student = StudentProfile.objects.filter(id=sid).first()
            if student:
                _, created = CourseEnrollment.objects.get_or_create(
                    course=course,
                    student=student,
                    defaults={'assigned_by': request.user}
                )
                if created:
                    created_count += 1

        return Response({
            'detail': f'Successfully updated course enrollments. {created_count} new students enrolled.'
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        course = generics.get_object_or_404(Course, pk=pk)
        student_id = request.data.get('student_id')
        if student_id:
            CourseEnrollment.objects.filter(course=course, student_id=student_id).delete()
            return Response({'detail': 'Student removed from course.'})
        return Response({'error': 'student_id required.'}, status=status.HTTP_400_BAD_REQUEST)
