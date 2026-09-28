from django.urls import path
from .views import (
    StartQuizAttemptView,
    ActiveAttemptView,
    SaveAnswerProgressiveView,
    SecurityEventRecordView,
    SubmitQuizAttemptView,
)

urlpatterns = [
    path('quiz/<int:quiz_id>/start/', StartQuizAttemptView.as_view(), name='quiz-start'),
    path('quiz/<int:quiz_id>/active/', ActiveAttemptView.as_view(), name='quiz-active'),
    path('<int:attempt_id>/save-answer/', SaveAnswerProgressiveView.as_view(), name='attempt-save-answer'),
    path('<int:attempt_id>/security-event/', SecurityEventRecordView.as_view(), name='attempt-security-event'),
    path('<int:attempt_id>/submit/', SubmitQuizAttemptView.as_view(), name='attempt-submit'),
]
