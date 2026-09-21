"""Infrastructure (Roads & Routing) views."""
import math
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Road
from .serializers import RoadSerializer
from apps.habitations.models import Habitation
from apps.shelters.models import Shelter


class RoadListView(generics.ListCreateAPIView):
    serializer_class = RoadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Road.objects.all()
        d = self.request.query_params.get("district")
        road_status = self.request.query_params.get("status")
        if d:
            qs = qs.filter(district_id=d)
        if road_status:
            qs = qs.filter(status=road_status)
        return qs


class RoadDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Road.objects.all()
    serializer_class = RoadSerializer
    permission_classes = [IsAuthenticated]


class RoadStatusView(APIView):
    """PATCH /roads/<pk>/status/ — update road blocked/open/caution status."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            road = Road.objects.get(pk=pk)
        except Road.DoesNotExist:
            return Response({"error": "Road not found"}, status=404)

        new_status = request.data.get("status")
        if new_status not in ("open", "blocked", "caution"):
            return Response(
                {"error": "status must be one of: open, blocked, caution"},
                status=400,
            )

        road.status = new_status
        road.flood_depth_cm = request.data.get("flood_depth_cm", road.flood_depth_cm)
        road.save(update_fields=["status", "flood_depth_cm"])

        _recompute_isolation(road)

        return Response(RoadSerializer(road).data)


class RouteCalculationView(APIView):
    """
    GET /api/v1/routes/<origin>/<destination>/
    Satisfies frontend ENDPOINTS.route(o, d).
    Calculates distance, road traversal status, and risk between origin and destination.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, origin, destination):
        # Resolve origin (habitation or shelter)
        orig_obj = (
            Habitation.objects.filter(id=origin).first()
            or Habitation.objects.filter(name__iexact=origin).first()
            or Shelter.objects.filter(id=origin).first()
            or Shelter.objects.filter(name__iexact=origin).first()
        )

        dest_obj = (
            Shelter.objects.filter(id=destination).first()
            or Shelter.objects.filter(name__iexact=destination).first()
            or Habitation.objects.filter(id=destination).first()
            or Habitation.objects.filter(name__iexact=destination).first()
        )

        if not orig_obj or not dest_obj:
            return Response({
                "origin": origin,
                "destination": destination,
                "error": "Could not resolve origin or destination location",
            }, status=404)

        # Haversine distance
        loc1 = orig_obj.location
        loc2 = dest_obj.location
        lat1, lng1 = loc1.y, loc1.x
        lat2, lng2 = loc2.y, loc2.x

        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
        )
        dist_km = round(R * 2 * math.asin(math.sqrt(a)), 2)

        # Find connecting roads
        district = getattr(orig_obj, "district", None) or getattr(dest_obj, "district", None)
        connecting_roads = Road.objects.filter(district=district) if district else Road.objects.all()

        route_blocked = False
        flood_depth = 0.0
        matched_roads = []

        for r in connecting_roads:
            connects = [str(x).lower() for x in (r.connects_habitations or [])]
            if orig_obj.id.lower() in connects or getattr(orig_obj, "name", "").lower() in connects:
                matched_roads.append(r)
                if r.status == "blocked":
                    route_blocked = True
                flood_depth = max(flood_depth, r.flood_depth_cm)

        route_risk = round(min(1.0, (dist_km / 30.0) * 0.4 + (0.5 if route_blocked else 0.0) + (flood_depth / 100.0) * 0.2), 3)

        return Response({
            "origin": {"id": orig_obj.id, "name": orig_obj.name, "coordinates": [lng1, lat1]},
            "destination": {"id": dest_obj.id, "name": dest_obj.name, "coordinates": [lng2, lat2]},
            "distance_km": dist_km,
            "route_risk": route_risk,
            "status": "blocked" if route_blocked else ("caution" if route_risk > 0.5 else "clear"),
            "blocked": route_blocked,
            "max_flood_depth_cm": flood_depth,
            "connecting_roads_count": len(matched_roads),
        })


def _recompute_isolation(changed_road):
    from apps.habitations.models import Habitation

    district = changed_road.district
    roads = Road.objects.filter(district=district)

    hab_roads: dict[str, list[str]] = {}
    for r in roads:
        for hab_id in (r.connects_habitations or []):
            hab_roads.setdefault(str(hab_id).lower(), []).append(r.status)

    for hab in Habitation.objects.filter(district=district):
        statuses = hab_roads.get(hab.id.lower(), []) or hab_roads.get(hab.name.lower(), [])
        if statuses:
            is_isolated = all(s == "blocked" for s in statuses)
            if hab.is_isolated != is_isolated:
                hab.is_isolated = is_isolated
                hab.save(update_fields=["is_isolated"])
