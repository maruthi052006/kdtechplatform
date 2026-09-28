from django.db import models

class Batch(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        ARCHIVED = 'archived', 'Archived'

    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Batches'

    def __str__(self):
        return f"{self.name} ({self.code})"
