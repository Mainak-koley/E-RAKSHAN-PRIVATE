from django.urls import path
from .views import SituationReportView, ComprehensiveReportView, ExportCSVReportView

urlpatterns = [
    path("situation-summary/", SituationReportView.as_view(), name="report-situation"),
    path("comprehensive/", ComprehensiveReportView.as_view(), name="report-comprehensive"),
    path("export-csv/", ExportCSVReportView.as_view(), name="report-export-csv"),
]
