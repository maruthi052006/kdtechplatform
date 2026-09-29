from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import User
from apps.students.models import StudentProfile

def resolve_user(identifier):
    """
    Finds a User by username, email, or linked student_id.
    """
    identifier = identifier.strip()
    # Check student_id first
    student_profile = StudentProfile.objects.filter(student_id__iexact=identifier).select_related('user').first()
    if student_profile:
        return student_profile.user

    # Check username or email
    return User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()

def admin_login_view(request):
    if request.user.is_authenticated:
        if request.user.is_admin_user:
            return redirect('admin_portal:dashboard')
        return redirect('student_portal:dashboard')

    if request.method == 'POST':
        identifier = request.POST.get('identifier', '').strip()
        password = request.POST.get('password', '')

        if not identifier or not password:
            messages.error(request, "Please provide both identifier and password.")
            return render(request, 'accounts/admin_login.html', {'identifier': identifier})

        target_user = resolve_user(identifier)
        if target_user:
            user = authenticate(request, username=target_user.username, password=password)
            if user:
                if not user.is_active:
                    messages.error(request, "This account is inactive. Please contact system admin.")
                    return render(request, 'accounts/admin_login.html', {'identifier': identifier})

                if not user.is_admin_user:
                    messages.error(request, "Access denied. Trainer or Administrator privileges required.")
                    return render(request, 'accounts/admin_login.html', {'identifier': identifier})

                login(request, user)
                messages.success(request, f"Welcome back, {user.first_name or user.username}!")
                next_url = request.GET.get('next') or request.POST.get('next') or 'admin_portal:dashboard'
                return redirect(next_url)

        messages.error(request, "Invalid trainer credentials. Please verify and try again.")
        return render(request, 'accounts/admin_login.html', {'identifier': identifier})

    return render(request, 'accounts/admin_login.html', {'next': request.GET.get('next', '')})

def student_login_view(request):
    if request.user.is_authenticated:
        if request.user.is_student_user:
            return redirect('student_portal:dashboard')
        return redirect('admin_portal:dashboard')

    if request.method == 'POST':
        identifier = request.POST.get('identifier', '').strip()
        password = request.POST.get('password', '')

        if not identifier or not password:
            messages.error(request, "Please enter your Student ID or username and password.")
            return render(request, 'accounts/student_login.html', {'identifier': identifier})

        target_user = resolve_user(identifier)
        if target_user:
            user = authenticate(request, username=target_user.username, password=password)
            if user:
                if not user.is_active:
                    messages.error(request, "Your student account is suspended or inactive.")
                    return render(request, 'accounts/student_login.html', {'identifier': identifier})

                login(request, user)
                messages.success(request, f"Welcome back, {user.first_name or user.username}!")
                next_url = request.GET.get('next') or request.POST.get('next') or 'student_portal:dashboard'
                return redirect(next_url)

        messages.error(request, "Invalid Student credentials. Verify your Student ID and password.")
        return render(request, 'accounts/student_login.html', {'identifier': identifier})

    return render(request, 'accounts/student_login.html', {'next': request.GET.get('next', '')})

def logout_view(request):
    logout(request)
    messages.info(request, "You have been securely signed out.")
    return redirect('public:landing')

@login_required
def profile_view(request):
    user = request.user
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()

        user.first_name = first_name
        user.last_name = last_name
        if email and email != user.email:
            if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
                messages.error(request, "That email address is already in use by another account.")
                return render(request, 'accounts/profile.html', {'user': user})
            user.email = email

        user.save()
        messages.success(request, "Profile updated successfully.")
        return redirect('accounts:profile')

    return render(request, 'accounts/profile.html', {'user': user})

@login_required
def change_password_view(request):
    if request.method == 'POST':
        old_password = request.POST.get('old_password', '')
        new_password = request.POST.get('new_password', '')
        confirm_password = request.POST.get('confirm_password', '')

        if not request.user.check_password(old_password):
            messages.error(request, "Your current password was entered incorrectly.")
            return render(request, 'accounts/change_password.html')

        if len(new_password) < 6:
            messages.error(request, "New password must be at least 6 characters long.")
            return render(request, 'accounts/change_password.html')

        if new_password != confirm_password:
            messages.error(request, "New passwords do not match.")
            return render(request, 'accounts/change_password.html')

        request.user.set_password(new_password)
        request.user.save()
        update_session_auth_hash(request, request.user)
        messages.success(request, "Your password has been changed successfully.")
        
        if request.user.is_admin_user:
            return redirect('admin_portal:dashboard')
        return redirect('student_portal:dashboard')

    return render(request, 'accounts/change_password.html')
