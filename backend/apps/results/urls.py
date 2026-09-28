from django.urls import path
from .views import ResultListView, ResultDetailView, ResultExportView

urlpatterns = [
    path('', ResultListView.as_view(), name='result-list'),
    path('export/', ResultExportView.as_view(), name='result-export'),
    path('<int:pk>/', ResultDetailView.as_view(), name='result-detail'),
]
