from django.urls import path
from .views import DecisionLogListCreateView, DecisionLogDetailView, AuditVerifyView

urlpatterns = [
    path("", DecisionLogListCreateView.as_view(), name="decision-list"),
    path("<int:pk>/", DecisionLogDetailView.as_view(), name="decision-detail"),
    path("<int:pk>/verify/", AuditVerifyView.as_view(), name="decision-verify"),
    path("log/", DecisionLogListCreateView.as_view(), name="decision-log-alias"),
]
