from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from apps.accounts.permissions import IsAdminRole
from .models import StudentProfile
from .serializers import StudentProfileSerializer, StudentCreateSerializer

class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentProfileSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = StudentProfile.objects.select_related('user', 'batch').prefetch_related('enrollments').all()

        # If student user, restrict to own profile
        if not user.is_admin_user:
            return queryset.filter(user=user)

        # Filters for admin
        batch_id = self.request.query_params.get('batch')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if search:
            queryset = queryset.filter(
                Q(student_id__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = StudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        read_serializer = StudentProfileSerializer(profile)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StudentProfile.objects.select_related('user', 'batch').all()
    serializer_class = StudentProfileSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
