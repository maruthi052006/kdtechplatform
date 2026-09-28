from django.urls import path
from .views import (
    QuestionListCreateView,
    QuestionDetailView,
    QuestionExcelValidateView,
    QuestionExcelCommitView,
    QuestionExportView,
)

urlpatterns = [
    path('', QuestionListCreateView.as_view(), name='question-list-create'),
    path('<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('validate-excel/', QuestionExcelValidateView.as_view(), name='question-validate-excel'),
    path('import-excel/', QuestionExcelCommitView.as_view(), name='question-import-excel'),
    path('export/', QuestionExportView.as_view(), name='question-export'),
]
