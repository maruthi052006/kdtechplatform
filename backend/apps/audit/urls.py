from django.urls import path
from .views import SecurityEventListView, AuditLogListView

urlpatterns = [
    path('security-events/', SecurityEventListView.as_view(), name='security-event-list'),
    path('logs/', AuditLogListView.as_view(), name='audit-log-list'),
]
