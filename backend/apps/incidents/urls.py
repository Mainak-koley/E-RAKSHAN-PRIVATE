from django.urls import path
from .views import IncidentListCreateView, IncidentVerifyView, IncidentDetailView

urlpatterns = [
    path("", IncidentListCreateView.as_view(), name="incident-list"),
    path("<str:pk>/", IncidentDetailView.as_view(), name="incident-detail"),
    path("<str:pk>/verify/", IncidentVerifyView.as_view(), name="incident-verify"),
]
