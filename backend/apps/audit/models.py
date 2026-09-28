from django.db import models
from django.conf import settings

class SecurityEvent(models.Model):
    attempt = models.ForeignKey(
        'attempts.QuizAttempt',
        on_delete=models.CASCADE,
        related_name='security_events'
    )
    event_type = models.CharField(max_length=50) # TAB_SWITCH, FULLSCREEN_EXIT, CLIPBOARD_ATTEMPT, DUPLICATE_TAB
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.event_type}] Attempt #{self.attempt_id} at {self.created_at}"

class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=100)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        actor = self.user.username if self.user else 'System'
        return f"{actor} -> {self.action} at {self.created_at}"
