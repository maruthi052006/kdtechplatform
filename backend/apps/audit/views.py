from rest_framework import generics
from apps.accounts.permissions import IsAdminRole
from .models import SecurityEvent, AuditLog
from .serializers import SecurityEventSerializer, AuditLogSerializer

class SecurityEventListView(generics.ListAPIView):
    serializer_class = SecurityEventSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = SecurityEvent.objects.select_related('attempt__student__user', 'attempt__quiz').all()
        quiz_id = self.request.query_params.get('quiz')
        attempt_id = self.request.query_params.get('attempt')
        if quiz_id:
            queryset = queryset.filter(attempt__quiz_id=quiz_id)
        if attempt_id:
            queryset = queryset.filter(attempt_id=attempt_id)
        return queryset

class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]
