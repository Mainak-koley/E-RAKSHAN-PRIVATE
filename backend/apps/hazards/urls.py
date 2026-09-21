from django.urls import path
from .views import (
    HazardEventListView,
    RedZoneListView,
    RedZoneDetailView,
    HazardCurrentView,
    HazardSimulateView,
)

urlpatterns = [
    path("events/", HazardEventListView.as_view(), name="hazard-events"),
    path("red-zones/", RedZoneListView.as_view(), name="hazard-redzones"),
    path("red-zones/<str:pk>/", RedZoneDetailView.as_view(), name="hazard-redzone-detail"),
    path("current/", HazardCurrentView.as_view(), name="hazards-current"),
    path("simulate/", HazardSimulateView.as_view(), name="hazards-simulate"),
]
