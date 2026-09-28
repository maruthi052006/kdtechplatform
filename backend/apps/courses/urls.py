from django.urls import path
from .views import CourseListCreateView, CourseDetailView, CourseStudentsView

urlpatterns = [
    path('', CourseListCreateView.as_view(), name='course-list-create'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/students/', CourseStudentsView.as_view(), name='course-students'),
]
