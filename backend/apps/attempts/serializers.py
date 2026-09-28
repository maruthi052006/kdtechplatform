from rest_framework import serializers
from django.utils import timezone
from .models import QuizAttempt, AttemptQuestion, AttemptAnswer

class AttemptQuestionStudentSerializer(serializers.ModelSerializer):
    snapshot_id = serializers.IntegerField(source='id')
    question_text = serializers.CharField(source='question.question_text')
    marks = serializers.DecimalField(source='question.marks', max_digits=5, decimal_places=2)
    options = serializers.SerializerMethodField()

    class Meta:
        model = AttemptQuestion
        fields = ['snapshot_id', 'display_order', 'question_text', 'marks', 'options']

    def get_options(self, obj):
        q = obj.question
        # Standard choices
        orig = {
            'A': q.option_a,
            'B': q.option_b,
            'C': q.option_c,
            'D': q.option_d,
        }
        mapping = obj.option_mapping or {}
        # If mapping is {'A': 'B', 'B': 'A', ...}, key 'A' presents orig['B']
        if mapping:
            return [{'key': k, 'text': orig[mapping[k]]} for k in ['A', 'B', 'C', 'D']]
        return [{'key': k, 'text': orig[k]} for k in ['A', 'B', 'C', 'D']]

class ActiveAttemptSerializer(serializers.ModelSerializer):
    attempt_id = serializers.IntegerField(source='id')
    quiz_id = serializers.IntegerField(source='quiz.id')
    quiz_title = serializers.CharField(source='quiz.title')
    course_id = serializers.IntegerField(source='quiz.course.id')
    course_name = serializers.CharField(source='quiz.course.name')
    duration_seconds = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()
    saved_answers = serializers.SerializerMethodField()
    security_settings = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'attempt_id', 'quiz_id', 'quiz_title', 'course_id', 'course_name',
            'attempt_number', 'started_at', 'deadline_at', 'status',
            'duration_seconds', 'remaining_seconds', 'questions',
            'saved_answers', 'tab_violations', 'security_settings'
        ]

    def get_duration_seconds(self, obj):
        return obj.quiz.duration_minutes * 60

    def get_remaining_seconds(self, obj):
        diff = (obj.deadline_at - timezone.now()).total_seconds()
        return max(0, int(diff))

    def get_questions(self, obj):
        snapshots = obj.question_snapshots.select_related('question').order_by('display_order')
        return AttemptQuestionStudentSerializer(snapshots, many=True).data

    def get_saved_answers(self, obj):
        answers = {}
        for snap in obj.question_snapshots.prefetch_related('answer').all():
            if hasattr(snap, 'answer') and snap.answer.selected_option:
                answers[snap.id] = snap.answer.selected_option
        return answers

    def get_security_settings(self, obj):
        q = obj.quiz
        return {
            'require_fullscreen': q.require_fullscreen,
            'tab_warning_limit': q.tab_warning_limit,
            'prevent_copy': q.prevent_copy,
            'negative_marking': q.negative_marking,
            'negative_marks': float(q.negative_marks)
        }

class QuizResultScorecardSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    course_name = serializers.CharField(source='quiz.course.name', read_only=True)
    student_name = serializers.SerializerMethodField()
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    total_marks = serializers.DecimalField(source='quiz.total_marks', max_digits=6, decimal_places=2, read_only=True)
    pass_percentage = serializers.DecimalField(source='quiz.pass_percentage', max_digits=5, decimal_places=2, read_only=True)
    questions_review = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'course_name', 'student_id', 'student_name',
            'attempt_number', 'started_at', 'submitted_at', 'status',
            'score', 'total_marks', 'percentage', 'pass_percentage', 'is_passed',
            'correct_count', 'wrong_count', 'unanswered_count', 'time_taken_seconds',
            'tab_violations', 'questions_review'
        ]

    def get_student_name(self, obj):
        full = obj.student.user.get_full_name()
        return full if full else obj.student.user.username

    def get_questions_review(self, obj):
        # Disclose answers only if show_answers is enabled or user is admin
        request = self.context.get('request')
        is_admin = request and request.user.is_admin_user
        if not obj.quiz.show_answers and not is_admin:
            return []

        review_data = []
        snapshots = obj.question_snapshots.select_related('question').prefetch_related('answer').order_by('display_order')
        for snap in snapshots:
            q = snap.question
            user_ans = getattr(snap, 'answer', None)
            selected_key = user_ans.selected_option if user_ans else None
            
            # Map back to show what the user selected in terms of original keys
            mapping = snap.option_mapping or {}
            orig = {
                'A': q.option_a,
                'B': q.option_b,
                'C': q.option_c,
                'D': q.option_d,
            }
            options = [{'key': k, 'text': orig[mapping.get(k, k)]} for k in ['A', 'B', 'C', 'D']] if mapping else [{'key': k, 'text': orig[k]} for k in ['A', 'B', 'C', 'D']]

            # Compute which candidate key corresponds to q.correct_answer
            correct_display_key = q.correct_answer
            if mapping:
                for k, v in mapping.items():
                    if v == q.correct_answer:
                        correct_display_key = k
                        break

            review_data.append({
                'snapshot_id': snap.id,
                'display_order': snap.display_order,
                'question_text': q.question_text,
                'options': options,
                'selected_option': selected_key,
                'correct_answer': correct_display_key,
                'is_correct': user_ans.is_correct if user_ans else False,
                'marks_awarded': user_ans.marks_awarded if user_ans else 0,
                'explanation': q.explanation or '',
                'difficulty': q.difficulty,
                'topic': q.topic.title if q.topic else (q.topic_name or 'General')
            })
        return review_data
