from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import RelocationPlan, RelocationAssignment
from .serializers import RelocationPlanSerializer, RelocationAssignmentSerializer
from .services import solve_relocation


class SolveView(APIView):
    """POST /relocation/solve/ — run the constrained relocation solver."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        source_ids = request.data.get("sources", [])
        if not source_ids:
            return Response({"error": "No source habitation IDs provided"}, status=400)

        result = solve_relocation(
            source_ids=source_ids,
            max_distance_km=float(request.data.get("max_distance_km", 15)),
            utilisation_cap=float(request.data.get("utilisation_cap", 0.95)),
            allow_overflow=bool(request.data.get("allow_overflow", False)),
            weights=request.data.get("weights"),
        )

        if "error" in result:
            return Response(result, status=400)

        return Response(result)


class PlanListView(generics.ListAPIView):
    """GET /relocation/plans/ — list all relocation plans."""
    queryset = RelocationPlan.objects.all().order_by("-created_at")
    serializer_class = RelocationPlanSerializer
    permission_classes = [IsAuthenticated]


class PlanDetailView(generics.RetrieveAPIView):
    """GET /relocation/plans/<pk>/ — get a specific relocation plan."""
    queryset = RelocationPlan.objects.all()
    serializer_class = RelocationPlanSerializer
    permission_classes = [IsAuthenticated]


class AssignmentListView(generics.ListAPIView):
    """
    GET /relocation/assignments/
    Returns assignments from the latest plan or filtered by plan_id / district.
    Satisfies frontend ENDPOINTS.relocationAssignments.
    """
    serializer_class = RelocationAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        plan_id = self.request.query_params.get("plan")
        if plan_id:
            return RelocationAssignment.objects.filter(plan_id=plan_id)

        # Default to latest plan's assignments
        latest_plan = RelocationPlan.objects.order_by("-created_at").first()
        if latest_plan:
            return RelocationAssignment.objects.filter(plan=latest_plan)
        return RelocationAssignment.objects.none()
