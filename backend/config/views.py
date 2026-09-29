from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import connection
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class HealthCheckView(APIView):
    """
    Production health check endpoint verifying database connectivity
    and application responsiveness.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        db_status = "ok"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_status = f"unhealthy: {str(e)}"

        status_code = 200 if db_status == "ok" else 503
        return Response(
            {
                "status": "ok" if db_status == "ok" else "degraded",
                "database": db_status,
                "version": "2.0.0",
                "timestamp": timezone.now().isoformat(),
            },
            status=status_code,
        )

def landing_page_view(request):
    """
    Renders the public landing page with active published courses.
    """
    from django.shortcuts import render
    from apps.courses.models import Course
    courses = Course.objects.filter(status='published')[:6]
    return render(request, 'public/index.html', {'courses': courses})

def error_403_view(request, exception=None):
    from django.shortcuts import render
    return render(request, 'errors/403.html', status=403)

def error_404_view(request, exception=None):
    from django.shortcuts import render
    return render(request, 'errors/404.html', status=404)

def error_500_view(request):
    from django.shortcuts import render
    return render(request, 'errors/500.html', status=500)
