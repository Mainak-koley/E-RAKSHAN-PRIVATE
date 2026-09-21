"""Red zones alias URL file — exposes /api/v1/red-zones/"""
from django.urls import path
from .views import RedZoneListView, RedZoneDetailView

urlpatterns = [
    path("", RedZoneListView.as_view(), name="redzone-list"),
    path("<str:pk>/", RedZoneDetailView.as_view(), name="redzone-detail"),
]

