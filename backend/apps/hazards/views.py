"""Hazards app views: HazardEvents, RedZones, Current, and Simulate."""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HazardEvent, RedZone
from .serializers import HazardEventSerializer, RedZoneSerializer
from apps.habitations.models import Habitation
from apps.intelligence.services import calculate_hazard, risk_band_for


class HazardEventListView(generics.ListCreateAPIView):
    serializer_class = HazardEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = HazardEvent.objects.all().order_by("-observed_at")
        d = self.request.query_params.get("district")
        t = self.request.query_params.get("type")
        if d:
            qs = qs.filter(district_id=d)
        if t:
            qs = qs.filter(hazard_type=t)
        return qs


class RedZoneListView(generics.ListCreateAPIView):
    serializer_class = RedZoneSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = RedZone.objects.all()
        d = self.request.query_params.get("district")
        active = self.request.query_params.get("active")
        if d:
            qs = qs.filter(district_id=d)
        if active is not None:
            qs = qs.filter(active=active.lower() in ("true", "1", "yes"))
        else:
            qs = qs.filter(active=True)
        return qs.order_by("-current_severity")


class RedZoneDetailView(generics.RetrieveUpdateAPIView):
    queryset = RedZone.objects.all()
    serializer_class = RedZoneSerializer
    permission_classes = [IsAuthenticated]


class HazardCurrentView(APIView):
    """
    GET /api/v1/hazards/current/
    Satisfies frontend ENDPOINTS.currentHazards.
    Returns active hazard events and active red zones for district.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        ev_qs = HazardEvent.objects.all().order_by("-observed_at")
        rz_qs = RedZone.objects.filter(active=True).order_by("-current_severity")

        if district_id:
            ev_qs = ev_qs.filter(district_id=district_id)
            rz_qs = rz_qs.filter(district_id=district_id)

        return Response({
            "events": HazardEventSerializer(ev_qs[:20], many=True).data,
            "red_zones": RedZoneSerializer(rz_qs, many=True).data,
        })


class HazardSimulateView(APIView):
    """
    POST /api/v1/hazards/simulate/
    Satisfies frontend ENDPOINTS.simulateHazard.
    Simulates increased rainfall / hazard intensity on habitations in a district
    and predicts changes in priority scores and critical count.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        district_id = request.data.get("district")
        rainfall_delta = float(request.data.get("rainfall_delta_mm", 40.0))
        simulated_severity = float(request.data.get("severity", 0.85))

        hab_qs = Habitation.objects.all()
        if district_id:
            hab_qs = hab_qs.filter(district_id=district_id)

        newly_critical = []
        projected_critical_count = 0

        for h in hab_qs:
            # Simulate temporary rainfall
            original_rain = h.rainfall24_mm
            h.rainfall24_mm = original_rain + rainfall_delta
            sim_hazard = calculate_hazard(h)
            h.rainfall24_mm = original_rain  # revert back

            sim_priority = round(0.45 * sim_hazard + 0.35 * h.vulnerability_score + 0.20 * h.exposure_score, 4)
            sim_band = risk_band_for(sim_priority)

            if sim_priority >= 0.80:
                projected_critical_count += 1
                if h.risk_band != "critical":
                    newly_critical.append({
                        "id": h.id,
                        "name": h.name,
                        "original_priority": h.priority_score,
                        "simulated_priority": sim_priority,
                        "original_band": h.risk_band,
                    })

        return Response({
            "status": "simulated",
            "parameters": {
                "rainfall_delta_mm": rainfall_delta,
                "simulated_severity": simulated_severity,
            },
            "projected_critical_count": projected_critical_count,
            "newly_critical_count": len(newly_critical),
            "newly_critical_habitations": newly_critical[:10],
        })
