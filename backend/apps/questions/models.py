from django.db import models
from django.conf import settings
from apps.courses.models import Course
from apps.curriculum.models import Topic

class Question(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    class AnswerChoice(models.TextChoices):
        A = 'A', 'A'
        B = 'B', 'B'
        C = 'C', 'C'
        D = 'D', 'D'

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='questions')
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    topic_name = models.CharField(max_length=150, blank=True, null=True) # Fallback if topic isn't linked to ID
    question_text = models.TextField()
    option_a = models.TextField()
    option_b = models.TextField()
    option_c = models.TextField()
    option_d = models.TextField()
    correct_answer = models.CharField(max_length=1, choices=AnswerChoice.choices)
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MEDIUM, db_index=True)
    explanation = models.TextField(blank=True, null=True)
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course', 'difficulty']),
            models.Index(fields=['topic']),
        ]

    def __str__(self):
        return f"[{self.course.code}] {self.question_text[:60]}..."
