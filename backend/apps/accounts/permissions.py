from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Allows access only to authenticated users with ADMIN role, staff, or superuser.
    """
    message = "Administrative privileges required to access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin_user
        )

class IsStudentRole(permissions.BasePermission):
    """
    Allows access to authenticated students (and Admins if impersonating/monitoring).
    """
    message = "Student credentials required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated
        )
