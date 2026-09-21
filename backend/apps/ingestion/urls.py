from django.urls import path
from .views import (
    IngestionHealthView,
    NormalizeView,
    TriggerWeatherSyncView,
    TriggerEarthquakeSyncView,
)

urlpatterns = [
    path("health/", IngestionHealthView.as_view(), name="ingestion-health"),
    path("normalize/", NormalizeView.as_view(), name="ingestion-normalize"),
    path("sync/weather/", TriggerWeatherSyncView.as_view(), name="sync-weather"),
    path("sync/earthquakes/", TriggerEarthquakeSyncView.as_view(), name="sync-earthquakes"),
]
