from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomLoginView, CurrentUserView, LogoutView

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
]
