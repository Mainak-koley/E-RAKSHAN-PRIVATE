"""
District views: Dashboard summary, GIS layers, Search.
"""
from django.db.models import Q, Sum
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import District
from .serializers import DistrictSerializer
from apps.habitations.models import Habitation
from apps.shelters.models import Shelter
from apps.hazards.models import RedZone
from apps.infrastructure.models import Road
from apps.incidents.models import Incident
from apps.alerts.models import Alert
from apps.sites.models import RelocationSite


class DistrictListView(generics.ListCreateAPIView):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated]


class DistrictDetailView(generics.RetrieveUpdateAPIView):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated]


class DashboardSummaryView(APIView):
    """
    Main dashboard summary endpoint.
    Frontend DashboardPage.jsx and SAI assistant both use this.
    Returns top-level free_beds and operational_shelters for SAI compatibility.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")

        hab_qs = (
            Habitation.objects.filter(district_id=district_id)
            if district_id
            else Habitation.objects.all()
        )
        shelter_qs = (
            Shelter.objects.filter(district_id=district_id)
            if district_id
            else Shelter.objects.all()
        )
        rz_qs = (
            RedZone.objects.filter(district_id=district_id, active=True)
            if district_id
            else RedZone.objects.filter(active=True)
        )
        incident_qs = (
            Incident.objects.filter(
                district_id=district_id,
                status__in=["unverified", "verified", "responding"],
            )
            if district_id
            else Incident.objects.filter(
                status__in=["unverified", "verified", "responding"]
            )
        )

        operational_shelters = shelter_qs.filter(operational=True)
        free_beds = sum(
            max(0, s.capacity - s.current_occupancy)
            for s in operational_shelters
        )
        total_capacity = sum(s.capacity for s in shelter_qs)
        total_occupancy = sum(s.current_occupancy for s in shelter_qs)

        top_risk = list(
            hab_qs.order_by("-priority_score").values(
                "id", "name", "priority_score", "risk_band", "population",
            )[:10]
        )

        latest_alert = None
        if district_id:
            latest_alert = (
                Alert.objects.filter(
                    district_id=district_id,
                    status__in=["new", "acknowledged"],
                )
                .order_by("-issued_at")
                .values("id", "severity", "message", "source", "alert_type")
                .first()
            )

        return Response({
            # Top-level convenience fields (used by SAI assistant)
            "free_beds": free_beds,
            "operational_shelters": operational_shelters.count(),
            # Full KPIs
            "district": district_id,
            "kpis": {
                "pop_at_risk": sum(
                    h["population"]
                    for h in hab_qs.filter(priority_score__gte=0.5).values("population")
                ),
                "critical_count": hab_qs.filter(priority_score__gte=0.80).count(),
                "high_count": hab_qs.filter(
                    priority_score__gte=0.60, priority_score__lt=0.80
                ).count(),
                "red_zones_active": rz_qs.count(),
                "free_beds": free_beds,
                "total_capacity": total_capacity,
                "total_occupancy": total_occupancy,
                "operational_shelters": operational_shelters.count(),
                "isolated_count": hab_qs.filter(is_isolated=True).count(),
                "active_incidents": incident_qs.count(),
            },
            "top_risk": top_risk,
            "latest_alert": latest_alert,
        })


class GISLayersView(APIView):
    """
    Returns all GIS layers for a district as GeoJSON-compatible dicts.
    Used by the tactical map.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")

        from apps.habitations.serializers import HabitationSerializer
        from apps.shelters.serializers import ShelterSerializer
        from apps.sites.serializers import RelocationSiteSerializer
        from apps.infrastructure.serializers import RoadSerializer
        from apps.incidents.serializers import IncidentSerializer
        from apps.hazards.serializers import RedZoneSerializer

        def qs(model, **filters):
            if district_id:
                filters["district_id"] = district_id
            return model.objects.filter(**filters)

        return Response({
            "habitations": HabitationSerializer(
                qs(Habitation), many=True
            ).data,
            "redzones": RedZoneSerializer(
                qs(RedZone, active=True), many=True
            ).data,
            "shelters": ShelterSerializer(
                qs(Shelter), many=True
            ).data,
            "safe_sites": RelocationSiteSerializer(
                qs(RelocationSite), many=True
            ).data,
            "roads": RoadSerializer(
                qs(Road), many=True
            ).data,
            "incidents": IncidentSerializer(
                qs(Incident), many=True
            ).data,
        })


class SearchView(APIView):
    """
    Cross-model name search. Returns up to 5 results per entity type.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if not q:
            return Response([])

        results = []
        models_kinds = [
            (Habitation, "habitation"),
            (Shelter, "shelter"),
            (RedZone, "red_zone"),
            (Road, "road"),
            (RelocationSite, "safe_site"),
        ]
        for model, kind in models_kinds:
            for obj in model.objects.filter(name__icontains=q)[:5]:
                results.append({
                    "type": kind,
                    "id": obj.pk,
                    "name": obj.name,
                })

        return Response(results)
