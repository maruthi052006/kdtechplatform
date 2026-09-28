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
                "version": "1.0.0",
                "timestamp": timezone.now().isoformat(),
            },
            status=status_code,
        )
