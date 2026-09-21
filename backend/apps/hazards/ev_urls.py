"""Hazard events alias URL file — exposes /api/v1/hazard-events/"""
from django.urls import path
from .views import HazardEventListView

urlpatterns = [
    path("", HazardEventListView.as_view(), name="hazard-event-list"),
]

