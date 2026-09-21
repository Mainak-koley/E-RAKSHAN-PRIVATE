from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Habitation
from .serializers import HabitationSerializer
from apps.intelligence.services import explain_habitation


class HabitationListView(generics.ListAPIView):
    serializer_class = HabitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Habitation.objects.all()
        district = self.request.query_params.get("district")
        band = self.request.query_params.get("band")
        q = self.request.query_params.get("search")
        if district:
            qs = qs.filter(district_id=district)
        if band == "critical":
            qs = qs.filter(priority_score__gte=0.8)
        elif band == "high":
            qs = qs.filter(priority_score__gte=0.6, priority_score__lt=0.8)
        elif band == "moderate":
            qs = qs.filter(priority_score__gte=0.4, priority_score__lt=0.6)
        elif band == "low":
            qs = qs.filter(priority_score__lt=0.4)
        if q:
            qs = qs.filter(name__icontains=q)
        return qs.order_by("-priority_score")


class HabitationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Habitation.objects.all()
    serializer_class = HabitationSerializer
    permission_classes = [IsAuthenticated]


class HabitationExplainView(generics.RetrieveAPIView):
    queryset = Habitation.objects.all()
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        return Response(explain_habitation(self.get_object()))


class HabitationAccessibilityView(generics.RetrieveAPIView):
    queryset = Habitation.objects.all()
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        h = self.get_object()
        return Response({
            "habitation_id": h.id,
            "name": h.name,
            "is_isolated": h.is_isolated,
            "message": "No safe land route available" if h.is_isolated else "Land access available",
        })


class SettlementPrioritiesView(APIView):
    """
    GET /api/v1/settlements/priorities/?district=<id>
    Satisfies frontend ENDPOINTS.settlementPriorities.
    Returns prioritized settlements list with ranking and risk details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district = request.query_params.get("district")
        qs = Habitation.objects.all()
        if district:
            qs = qs.filter(district_id=district)

        priorities = qs.order_by("-priority_score")[:25]
        return Response(HabitationSerializer(priorities, many=True).data)
