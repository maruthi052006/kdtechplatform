from django.db import models
from django.conf import settings
from apps.students.models import StudentProfile

class Course(models.Model):
    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField()
    category = models.CharField(max_length=100)
    level = models.CharField(max_length=30, choices=Level.choices, default=Level.INTERMEDIATE)
    duration_weeks = models.PositiveIntegerField(default=8)
    thumbnail = models.URLField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"

class CourseEnrollment(models.Model):
    class Status(models.TextChoices):
        ENROLLED = 'enrolled', 'Enrolled'
        COMPLETED = 'completed', 'Completed'
        DROPPED = 'dropped', 'Dropped'

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ENROLLED)

    class Meta:
        unique_together = ('student', 'course')
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.student.student_id} -> {self.course.code}"
