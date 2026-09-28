from rest_framework import serializers
from .models import CourseWeek, Topic

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'week', 'title', 'summary', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']

class CourseWeekSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    quizzes = serializers.SerializerMethodField()

    class Meta:
        model = CourseWeek
        fields = [
            'id', 'course', 'week_number', 'title', 'description',
            'order', 'topics', 'quizzes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'topics', 'quizzes']

    def get_quizzes(self, obj):
        from apps.quizzes.serializers import QuizSummarySerializer
        quizzes = obj.quizzes.all()
        return QuizSummarySerializer(quizzes, many=True).data
