from rest_framework import serializers
from django.db import transaction
from apps.accounts.models import User
from .models import StudentProfile
from apps.batches.models import Batch

class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    name = serializers.SerializerMethodField()
    avatar = serializers.CharField(source='user.avatar', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    course_ids = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    completed_quizzes_count = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'student_id', 'username', 'name', 'email', 'avatar',
            'batch', 'batch_name', 'status', 'phone', 'last_active_at',
            'created_at', 'course_ids', 'average_score', 'completed_quizzes_count'
        ]
        read_only_fields = ['id', 'created_at', 'last_active_at']

    def get_name(self, obj):
        full = obj.user.get_full_name()
        return full if full else obj.user.username

    def get_course_ids(self, obj):
        return list(obj.enrollments.values_list('course_id', flat=True))

    def get_average_score(self, obj):
        from apps.attempts.models import QuizAttempt
        attempts = QuizAttempt.objects.filter(student=obj, status='SUBMITTED')
        if not attempts.exists():
            return 0
        from django.db.models import Avg
        avg = attempts.aggregate(Avg('percentage'))['percentage__avg']
        return round(avg, 1) if avg else 0

    def get_completed_quizzes_count(self, obj):
        from apps.attempts.models import QuizAttempt
        return QuizAttempt.objects.filter(student=obj, status='SUBMITTED').count()

class StudentCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    student_id = serializers.CharField(max_length=50)
    password = serializers.CharField(write_only=True, min_length=6)
    batch_id = serializers.IntegerField(required=False, allow_null=True)
    course_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=[])
    status = serializers.ChoiceField(choices=StudentProfile.Status.choices, default=StudentProfile.Status.ACTIVE)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_student_id(self, value):
        if StudentProfile.objects.filter(student_id__iexact=value).exists():
            raise serializers.ValidationError("A student with this Student ID already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def create(self, validated_data):
        from apps.courses.models import CourseEnrollment, Course
        name = validated_data.pop('name')
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        student_id = validated_data.pop('student_id')
        batch_id = validated_data.pop('batch_id', None)
        course_ids = validated_data.pop('course_ids', [])
        status_val = validated_data.pop('status', StudentProfile.Status.ACTIVE)
        phone = validated_data.pop('phone', '')

        with transaction.atomic():
            user = User(
                username=username,
                email=email,
                role=User.Role.STUDENT
            )
            # Split name into first and last name
            parts = name.strip().split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user.set_password(password)
            user.save()

            batch = None
            if batch_id:
                batch = Batch.objects.filter(id=batch_id).first()

            profile = StudentProfile.objects.create(
                user=user,
                student_id=student_id,
                batch=batch,
                phone=phone,
                status=status_val
            )

            # Assign courses
            for cid in course_ids:
                course = Course.objects.filter(id=cid).first()
                if course:
                    CourseEnrollment.objects.get_or_create(
                        student=profile,
                        course=course
                    )

            return profile
