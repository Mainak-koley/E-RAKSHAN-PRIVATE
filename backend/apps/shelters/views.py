from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Shelter
from .serializers import ShelterSerializer


class ShelterListView(generics.ListCreateAPIView):
    serializer_class = ShelterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Shelter.objects.all()
        d = self.request.query_params.get("district")
        operational = self.request.query_params.get("operational")
        if d:
            qs = qs.filter(district_id=d)
        if operational is not None:
            qs = qs.filter(operational=operational.lower() in ("true", "1", "yes"))
        return qs


class ShelterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Shelter.objects.all()
    serializer_class = ShelterSerializer
    permission_classes = [IsAuthenticated]


class ShelterCapacityView(APIView):
    """
    GET /shelters/<pk>/capacity/
    Returns full capacity breakdown, free beds, resources, and operational status.
    Directly satisfies frontend ENDPOINTS.shelterCapacity(id).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            shelter = Shelter.objects.get(pk=pk)
        except Shelter.DoesNotExist:
            return Response({"error": "Shelter not found"}, status=404)

        free_cap = max(0, shelter.capacity - shelter.current_occupancy)
        occupancy_rate = round((shelter.current_occupancy / max(shelter.capacity, 1)) * 100, 1)

        return Response({
            "shelter_id": shelter.id,
            "name": shelter.name,
            "district": shelter.district.name if shelter.district else None,
            "total_capacity": shelter.capacity,
            "current_occupancy": shelter.current_occupancy,
            "free_capacity": free_cap,
            "occupancy_percentage": occupancy_rate,
            "operational": shelter.operational,
            "medical_support": shelter.medical_support,
            "water_kl": shelter.water_kl,
            "sanitation_ok": shelter.sanitation_ok,
            "amenities": shelter.amenities,
            "managed_by": shelter.managed_by,
        })


class ShelterOccupancyView(generics.UpdateAPIView):
    queryset = Shelter.objects.all()
    serializer_class = ShelterSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        s = self.get_object()
        occ = int(request.data.get("occupancy", s.current_occupancy))
        if occ < 0 or occ > s.capacity:
            return Response({"error": "Occupancy must be between 0 and capacity."}, status=400)
        s.current_occupancy = occ
        s.save(update_fields=["current_occupancy"])
        return Response(self.get_serializer(s).data)


class ShelterOperationalView(generics.UpdateAPIView):
    queryset = Shelter.objects.all()
    serializer_class = ShelterSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        s = self.get_object()
        s.operational = bool(request.data.get("operational", s.operational))
        s.save(update_fields=["operational"])
        return Response(self.get_serializer(s).data)
