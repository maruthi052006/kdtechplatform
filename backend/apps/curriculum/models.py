from django.db import models
from apps.courses.models import Course

class CourseWeek(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='weeks')
    week_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['week_number', 'order']
        unique_together = ('course', 'week_number')

    def __str__(self):
        return f"{self.course.code} - Week {self.week_number}: {self.title}"

class Topic(models.Model):
    week = models.ForeignKey(CourseWeek, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=200)
    summary = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Week {self.week.week_number} - {self.title}"
