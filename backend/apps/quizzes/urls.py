from django.urls import path
from .views import QuizListCreateView, QuizDetailView, QuizPublishView

urlpatterns = [
    path('', QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:pk>/publish/', QuizPublishView.as_view(), name='quiz-publish'),
]
