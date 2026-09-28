from rest_framework import serializers
from .models import Question

class QuestionAdminSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    topic_title = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'course', 'course_name', 'course_code', 'topic', 'topic_name', 'topic_title',
            'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'difficulty', 'explanation', 'marks',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_topic_title(self, obj):
        if obj.topic:
            return obj.topic.title
        return obj.topic_name or 'General'

class QuestionStudentExamSerializer(serializers.ModelSerializer):
    """
    STRICTLY OMIT: correct_answer, explanation.
    Used exclusively when a student is currently taking an assessment.
    """
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'question_text', 'options', 'difficulty', 'marks'
        ]

    def get_options(self, obj):
        return [
            {'key': 'A', 'text': obj.option_a},
            {'key': 'B', 'text': obj.option_b},
            {'key': 'C', 'text': obj.option_c},
            {'key': 'D', 'text': obj.option_d},
        ]

class QuestionReviewSerializer(serializers.ModelSerializer):
    """
    Used only post-submission when review is authorized.
    """
    options = serializers.SerializerMethodField()
    topic_title = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'question_text', 'options', 'correct_answer',
            'explanation', 'difficulty', 'marks', 'topic_title'
        ]

    def get_options(self, obj):
        return [
            {'key': 'A', 'text': obj.option_a},
            {'key': 'B', 'text': obj.option_b},
            {'key': 'C', 'text': obj.option_c},
            {'key': 'D', 'text': obj.option_d},
        ]

    def get_topic_title(self, obj):
        return obj.topic.title if obj.topic else (obj.topic_name or 'General')
