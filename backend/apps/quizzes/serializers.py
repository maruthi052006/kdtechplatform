from rest_framework import serializers
from django.db import transaction
from .models import Quiz, QuizQuestion
from apps.questions.models import Question
from apps.questions.serializers import QuestionAdminSerializer

class QuizSummarySerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    week_number = serializers.IntegerField(source='week.week_number', read_only=True)
    questions_count = serializers.SerializerMethodField()
    has_attempted = serializers.SerializerMethodField()
    latest_score = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'course_name', 'course_code', 'week', 'week_number',
            'title', 'description', 'duration_minutes', 'total_marks',
            'pass_percentage', 'start_at', 'deadline', 'max_attempts',
            'status', 'questions_count', 'has_attempted', 'latest_score',
            'require_fullscreen', 'tab_warning_limit', 'negative_marking', 'negative_marks'
        ]

    def get_questions_count(self, obj):
        return obj.quiz_questions.count()

    def get_has_attempted(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'student_profile'):
            from apps.attempts.models import QuizAttempt
            return QuizAttempt.objects.filter(
                quiz=obj,
                student=request.user.student_profile,
                status='SUBMITTED'
            ).exists()
        return False

    def get_latest_score(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'student_profile'):
            from apps.attempts.models import QuizAttempt
            latest = QuizAttempt.objects.filter(
                quiz=obj,
                student=request.user.student_profile,
                status='SUBMITTED'
            ).order_by('-submitted_at').first()
            if latest:
                return {
                    'score': latest.score,
                    'percentage': latest.percentage,
                    'is_passed': latest.is_passed,
                    'attempt_id': latest.id
                }
        return None

class QuizDetailSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    questions = serializers.SerializerMethodField()
    question_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'course_name', 'course_code', 'week',
            'title', 'description', 'duration_minutes', 'total_marks',
            'pass_percentage', 'start_at', 'deadline', 'max_attempts',
            'random_questions', 'random_options', 'negative_marking',
            'negative_marks', 'show_result', 'show_answers', 'status',
            'require_fullscreen', 'tab_warning_limit', 'prevent_copy',
            'questions', 'question_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'questions']

    def get_questions(self, obj):
        request = self.context.get('request')
        if request and request.user.is_admin_user:
            questions = Question.objects.filter(quiz_mappings__quiz=obj).order_by('quiz_mappings__order')
            return QuestionAdminSerializer(questions, many=True).data
        return []

    def create(self, validated_data):
        question_ids = validated_data.pop('question_ids', [])
        with transaction.atomic():
            quiz = Quiz.objects.create(**validated_data)
            quiz_questions = []
            for order, q_id in enumerate(question_ids, start=1):
                question = Question.objects.filter(id=q_id).first()
                if question:
                    quiz_questions.append(
                        QuizQuestion(
                            quiz=quiz,
                            question=question,
                            order=order,
                            marks=question.marks
                        )
                    )
            QuizQuestion.objects.bulk_create(quiz_questions)
            return quiz

    def update(self, instance, validated_data):
        question_ids = validated_data.pop('question_ids', None)
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if question_ids is not None:
                QuizQuestion.objects.filter(quiz=instance).delete()
                quiz_questions = []
                for order, q_id in enumerate(question_ids, start=1):
                    question = Question.objects.filter(id=q_id).first()
                    if question:
                        quiz_questions.append(
                            QuizQuestion(
                                quiz=instance,
                                question=question,
                                order=order,
                                marks=question.marks
                            )
                        )
                QuizQuestion.objects.bulk_create(quiz_questions)
            return instance
