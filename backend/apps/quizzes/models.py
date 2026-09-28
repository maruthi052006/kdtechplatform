from django.db import models
from django.conf import settings
from apps.courses.models import Course
from apps.curriculum.models import CourseWeek
from apps.questions.models import Question

class Quiz(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')
    week = models.ForeignKey(CourseWeek, on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=100.00)
    pass_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=60.00)
    start_at = models.DateTimeField()
    deadline = models.DateTimeField()
    max_attempts = models.PositiveIntegerField(default=1)
    random_questions = models.BooleanField(default=False)
    random_options = models.BooleanField(default=False)
    negative_marking = models.BooleanField(default=False)
    negative_marks = models.DecimalField(max_digits=4, decimal_places=2, default=0.25)
    show_result = models.BooleanField(default=True)
    show_answers = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    
    # Anti-cheat / Security deterrent settings
    require_fullscreen = models.BooleanField(default=True)
    tab_warning_limit = models.PositiveIntegerField(default=3)
    prevent_copy = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_at']

    def __str__(self):
        return f"{self.title} ({self.course.code})"

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='quiz_mappings')
    order = models.PositiveIntegerField(default=0)
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)

    class Meta:
        ordering = ['order', 'id']
        unique_together = ('quiz', 'question')

    def __str__(self):
        return f"{self.quiz.title} -> Q#{self.question.id}"
