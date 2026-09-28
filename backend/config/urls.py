from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # System & Health
    path('api/health/', HealthCheckView.as_view(), name='health-check'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Modular Domain APIs
    path('api/auth/', include('apps.accounts.urls')),
    path('api/batches/', include('apps.batches.urls')),
    path('api/students/', include('apps.students.urls')),
    path('api/courses/', include('apps.courses.urls')),
    path('api/curriculum/', include('apps.curriculum.urls')),
    path('api/questions/', include('apps.questions.urls')),
    path('api/quizzes/', include('apps.quizzes.urls')),
    path('api/attempts/', include('apps.attempts.urls')),
    path('api/results/', include('apps.results.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/announcements/', include('apps.announcements.urls')),
    path('api/audit/', include('apps.audit.urls')),
]
