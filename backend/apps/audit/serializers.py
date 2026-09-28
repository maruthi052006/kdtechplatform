from rest_framework import serializers
from .models import SecurityEvent, AuditLog

class SecurityEventSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='attempt.student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    quiz_title = serializers.CharField(source='attempt.quiz.title', read_only=True)

    class Meta:
        model = SecurityEvent
        fields = [
            'id', 'attempt', 'student_id', 'student_name', 'quiz_title',
            'event_type', 'metadata', 'created_at'
        ]

    def get_student_name(self, obj):
        full = obj.attempt.student.user.get_full_name()
        return full if full else obj.attempt.student.user.username

class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'actor_username', 'action', 'ip_address', 'details', 'created_at']
