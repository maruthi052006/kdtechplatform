from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import User

class UserSerializer(serializers.ModelSerializer):
    student_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'avatar', 'is_active', 'created_at', 'student_profile'
        ]
        read_only_fields = ['id', 'created_at', 'role', 'student_profile']

    def get_student_profile(self, obj):
        if hasattr(obj, 'student_profile'):
            profile = obj.student_profile
            return {
                'id': profile.id,
                'student_id': profile.student_id,
                'batch_id': profile.batch_id,
                'batch_name': profile.batch.name if profile.batch else None,
                'status': profile.status,
                'assigned_course_ids': list(profile.enrollments.values_list('course_id', flat=True))
            }
        return None

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    portal = serializers.CharField(required=False, write_only=True)

    def validate(self, attrs):
        username_or_id = attrs.get('username', '').strip()
        password = attrs.get('password', '')
        portal = attrs.get('portal', '').lower()

        # Check user by username, email, or student_id
        user = User.objects.filter(
            Q(username__iexact=username_or_id) |
            Q(email__iexact=username_or_id) |
            Q(student_profile__student_id__iexact=username_or_id)
        ).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError({
                'detail': 'Invalid credentials. Please verify your username/student ID and password.'
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'This account has been deactivated. Please contact your administrator.'
            })

        # Role enforcement per portal
        if portal == 'admin' and not user.is_admin_user:
            raise serializers.ValidationError({
                'detail': 'Access denied. You do not possess administrator credentials.'
            })
        
        # Build token response
        refresh = RefreshToken.for_user(user)  # type: ignore[arg-type]
        refresh['role'] = user.role
        refresh['username'] = user.username

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }
        return data
