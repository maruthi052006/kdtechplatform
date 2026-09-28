from rest_framework import serializers
from .models import Announcement

class AnnouncementSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'course', 'course_name',
            'batch', 'batch_name', 'priority', 'created_by',
            'author_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'author_name', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        if obj.created_by:
            full = obj.created_by.get_full_name()
            return full if full else obj.created_by.username
        return 'KDTechX Trainer'
