from rest_framework import serializers
from .models import Course, CourseEnrollment
from apps.students.models import StudentProfile

class CourseEnrollmentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(source='student.user.email', read_only=True)
    batch_name = serializers.CharField(source='student.batch.name', read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = [
            'id', 'student', 'student_id', 'student_name', 'student_email',
            'batch_name', 'course', 'assigned_at', 'status'
        ]
        read_only_fields = ['id', 'assigned_at']

    def get_student_name(self, obj):
        full = obj.student.user.get_full_name()
        return full if full else obj.student.user.username

class CourseSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.SerializerMethodField()
    weeks_count = serializers.SerializerMethodField()
    quizzes_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'category', 'level',
            'duration_weeks', 'thumbnail', 'status', 'created_by',
            'created_at', 'updated_at', 'enrolled_count', 'weeks_count', 'quizzes_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'enrolled_count', 'weeks_count', 'quizzes_count']

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()

    def get_weeks_count(self, obj):
        return obj.weeks.count() if hasattr(obj, 'weeks') else 0

    def get_quizzes_count(self, obj):
        return obj.quizzes.count() if hasattr(obj, 'quizzes') else 0
