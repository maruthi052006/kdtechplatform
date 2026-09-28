from rest_framework import serializers
from .models import Batch

class BatchSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = [
            'id', 'name', 'code', 'description', 'status',
            'created_at', 'updated_at', 'student_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'student_count']

    def get_student_count(self, obj):
        return obj.students.count() if hasattr(obj, 'students') else 0
