from django.db import models
from django.conf import settings
from apps.courses.models import Course
from apps.batches.models import Batch

class Announcement(models.Model):
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    title = models.CharField(max_length=200)
    content = models.TextField()
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority.upper()}] {self.title}"
