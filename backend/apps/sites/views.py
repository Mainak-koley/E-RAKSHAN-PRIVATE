"""Safe Sites views."""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import RelocationSite
from .serializers import RelocationSiteSerializer


class SiteListView(generics.ListAPIView):
    serializer_class = RelocationSiteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = RelocationSite.objects.all()
        d = self.request.query_params.get("district")
        site_type = self.request.query_params.get("type")
        if d:
            qs = qs.filter(district_id=d)
        if site_type:
            qs = qs.filter(type=site_type)
        return qs.order_by("-overall_suitability")


class SiteDetailView(generics.RetrieveAPIView):
    queryset = RelocationSite.objects.all()
    serializer_class = RelocationSiteSerializer
    permission_classes = [IsAuthenticated]


class SiteCapacityView(APIView):
    """
    Returns capacity estimate for a site.
    Uses area_ha * density_factor (configurable).
    """
    permission_classes = [IsAuthenticated]
    PERSONS_PER_HA = 60  # conservative estimate per hectare

    def get(self, request, pk):
        try:
            site = RelocationSite.objects.get(pk=pk)
        except RelocationSite.DoesNotExist:
            return Response({"error": "Site not found"}, status=404)

        estimated_capacity = int(site.area_ha * self.PERSONS_PER_HA)
        return Response({
            "site_id": site.id,
            "site_name": site.name,
            "area_ha": site.area_ha,
            "estimated_capacity": estimated_capacity,
            "persons_per_ha": self.PERSONS_PER_HA,
            "suitability": site.overall_suitability,
            "note": "Capacity estimate based on area. Field verification required.",
        })
