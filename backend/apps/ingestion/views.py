"""
Ingestion views — sync triggers and health endpoints.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.districts.models import District
from .services import (
    normalize_record,
    fetch_weather_for_district,
    fetch_usgs_earthquakes,
)


class IngestionHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "status": "ok",
            "adapters": {
                "weather": "open-meteo (live)",
                "earthquake": "usgs (live)",
                "damini": "configured",
                "gdacs": "configured",
                "osm": "configured",
            },
        })


class NormalizeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(normalize_record(request.data))


class TriggerWeatherSyncView(APIView):
    """
    POST /api/v1/ingestion/sync/weather/?district=<id>
    Triggers immediate weather synchronization from Open-Meteo.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        district_id = request.query_params.get("district") or request.data.get("district")
        if district_id:
            districts = District.objects.filter(pk=district_id)
        else:
            districts = District.objects.all()

        results = [fetch_weather_for_district(d) for d in districts]
        return Response({
            "message": "Weather sync executed",
            "results": results,
        })


class TriggerEarthquakeSyncView(APIView):
    """
    POST /api/v1/ingestion/sync/earthquakes/
    Triggers immediate earthquake synchronization from USGS feed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        min_mag = float(request.query_params.get("min_mag", 3.0))
        events = fetch_usgs_earthquakes(min_magnitude=min_mag)
        return Response({
            "message": f"USGS sync executed: {len(events)} events processed",
            "events": events,
        })
