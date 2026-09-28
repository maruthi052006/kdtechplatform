from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminRole
from .models import Batch
from .serializers import BatchSerializer

class BatchListCreateView(generics.ListCreateAPIView):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [IsAuthenticated()]

class BatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
