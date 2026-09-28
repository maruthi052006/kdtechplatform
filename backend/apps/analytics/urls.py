from django.urls import path
from .views import AdminAnalyticsView, StudentAnalyticsView

urlpatterns = [
    path('admin/', AdminAnalyticsView.as_view(), name='analytics-admin'),
    path('student/', StudentAnalyticsView.as_view(), name='analytics-student'),
]
