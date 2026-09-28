from django.urls import path
from .views import (
    CourseCurriculumTreeView,
    WeekListCreateView,
    WeekDetailView,
    TopicListCreateView,
    TopicDetailView,
)

urlpatterns = [
    path('course/<int:course_id>/', CourseCurriculumTreeView.as_view(), name='curriculum-tree'),
    path('weeks/', WeekListCreateView.as_view(), name='week-list-create'),
    path('weeks/<int:pk>/', WeekDetailView.as_view(), name='week-detail'),
    path('topics/', TopicListCreateView.as_view(), name='topic-list-create'),
    path('topics/<int:pk>/', TopicDetailView.as_view(), name='topic-detail'),
]
