from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin / Trainer'
        STUDENT = 'STUDENT', 'Student / Candidate'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True
    )
    avatar = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_staff or self.is_superuser

    @property
    def is_student_user(self):
        return self.role == self.Role.STUDENT

    def __str__(self):
        return f"{self.username} ({self.role})"
