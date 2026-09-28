from django.db import models
from apps.quizzes.models import Quiz
from apps.students.models import StudentProfile
from apps.questions.models import Question

class QuizAttempt(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        TIMED_OUT = 'TIMED_OUT', 'Timed Out'
        TERMINATED = 'TERMINATED', 'Terminated'

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='quiz_attempts')
    attempt_number = models.PositiveIntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    deadline_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS, db_index=True)
    
    # Evaluated Scoring fields
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_passed = models.BooleanField(default=False)
    correct_count = models.PositiveIntegerField(default=0)
    wrong_count = models.PositiveIntegerField(default=0)
    unanswered_count = models.PositiveIntegerField(default=0)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    tab_violations = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']
        unique_together = ('quiz', 'student', 'attempt_number')
        indexes = [
            models.Index(fields=['quiz', 'student', 'status']),
            models.Index(fields=['status', 'deadline_at']),
        ]

    def __str__(self):
        return f"{self.student.student_id} - {self.quiz.title} (Attempt #{self.attempt_number})"

class AttemptQuestion(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='question_snapshots')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    display_order = models.PositiveIntegerField()
    # option_mapping stores candidate view key -> original question key, e.g. {"A": "B", "B": "C", ...}
    option_mapping = models.JSONField(default=dict)

    class Meta:
        ordering = ['display_order', 'id']
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Attempt #{self.attempt.id} -> Q#{self.question.id} (Order: {self.display_order})"

class AttemptAnswer(models.Model):
    attempt_question = models.OneToOneField(AttemptQuestion, on_delete=models.CASCADE, related_name='answer')
    selected_option = models.CharField(max_length=1, null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    marks_awarded = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    answered_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Answer for AttemptQ#{self.attempt_question.id}: {self.selected_option}"
