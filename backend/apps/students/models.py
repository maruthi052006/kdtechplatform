from django.db import models
from django.conf import settings
from apps.batches.models import Batch

class StudentProfile(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        SUSPENDED = 'suspended', 'Suspended'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    student_id = models.CharField(max_length=50, unique=True, db_index=True)
    batch = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    phone = models.CharField(max_length=30, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    last_active_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['student_id']

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.student_id})"
