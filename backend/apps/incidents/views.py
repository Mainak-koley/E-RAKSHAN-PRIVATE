import uuid
from django.contrib.gis.geos import Point
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Incident
from .serializers import IncidentSerializer
from apps.ingestion.services import confidence_for_incident


class IncidentListCreateView(generics.ListCreateAPIView):
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Incident.objects.all().order_by("-reported_at")
        d = self.request.query_params.get("district")
        s = self.request.query_params.get("status")
        if d:
            qs = qs.filter(district_id=d)
        if s:
            qs = qs.filter(status=s)
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        coords = data.pop("coordinates", None)
        if not coords:
            return Response({"error": "coordinates [lng, lat] are required"}, status=400)

        obj = Incident(
            id=data.get("id") or f"INC-{uuid.uuid4().hex[:8]}",
            district_id=data["district"],
            incident_type=data.get("type", data.get("incident_type", "Unknown")),
            severity=data.get("severity", "medium"),
            location=Point(float(coords[0]), float(coords[1]), srid=4326),
            location_name=data.get("location_name", ""),
            description=data.get("description", ""),
            source=data.get("source", "citizen"),
            reported_by=request.user if request.user.is_authenticated else None,
        )
        obj.confidence = confidence_for_incident(obj)
        obj.save()
        return Response(self.get_serializer(obj).data, status=201)


class IncidentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]


class IncidentVerifyView(generics.UpdateAPIView):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.status = "verified" if request.data.get("status") == "verified" else request.data.get("status", obj.status)
        obj.authority_confirmed = bool(request.data.get("authority_confirmed", obj.authority_confirmed))
        obj.verified_by = request.user if request.user.is_authenticated else None
        obj.confidence = confidence_for_incident(obj)
        obj.save()
        return Response(self.get_serializer(obj).data)
