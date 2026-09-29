from django.urls import path
from . import web_views

app_name = 'accounts'

urlpatterns = [
    path('login/admin/', web_views.admin_login_view, name='admin_login'),
    path('login/student/', web_views.student_login_view, name='student_login'),
    path('logout/', web_views.logout_view, name='logout'),
    path('profile/', web_views.profile_view, name='profile'),
    path('change-password/', web_views.change_password_view, name='change_password'),
]
