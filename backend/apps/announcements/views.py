from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from apps.accounts.permissions import IsAdminRole
from .models import Announcement
from .serializers import AnnouncementSerializer

class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            return Announcement.objects.select_related('course', 'batch', 'created_by').all()

        if hasattr(user, 'student_profile'):
            student = user.student_profile
            course_ids = student.enrollments.values_list('course_id', flat=True)
            return Announcement.objects.filter(
                Q(course__isnull=True, batch__isnull=True) | # Global
                Q(batch=student.batch) | # Batch-specific
                Q(course_id__in=course_ids) # Course-specific
            ).select_related('course', 'batch', 'created_by').distinct()

        return Announcement.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
