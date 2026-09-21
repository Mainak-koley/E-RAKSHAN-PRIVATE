from django.urls import path
from .views import (
    ShelterListView,
    ShelterDetailView,
    ShelterCapacityView,
    ShelterOccupancyView,
    ShelterOperationalView,
)

urlpatterns = [
    path("", ShelterListView.as_view(), name="shelter-list"),
    path("<str:pk>/", ShelterDetailView.as_view(), name="shelter-detail"),
    path("<str:pk>/capacity/", ShelterCapacityView.as_view(), name="shelter-capacity"),
    path("<str:pk>/occupancy/", ShelterOccupancyView.as_view(), name="shelter-occupancy"),
    path("<str:pk>/operational/", ShelterOperationalView.as_view(), name="shelter-operational"),
]
