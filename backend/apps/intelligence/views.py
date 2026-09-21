from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.habitations.models import Habitation
from apps.districts.models import District
from .services import recalculate_all, recalculate_habitation


class RiskRecalculateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        district_id = request.data.get("district")
        district = District.objects.filter(pk=district_id).first() if district_id else None
        count = recalculate_all(district=district)

        qs = Habitation.objects.filter(district=district) if district else Habitation.objects.all()
        return Response({
            "updated": count,
            "district": district.name if district else "All",
            "habitations": [
                {
                    "id": h.id,
                    "name": h.name,
                    "hazard_score": h.hazard_score,
                    "vulnerability_score": h.vulnerability_score,
                    "exposure_score": h.exposure_score,
                    "priority_score": h.priority_score,
                    "band": h.risk_band,
                }
                for h in qs.order_by("-priority_score")[:20]
            ],
        })


class RiskMatrixView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        qs = Habitation.objects.filter(district_id=district_id) if district_id else Habitation.objects.all()

        return Response({
            "matrix": [
                ["low", "moderate", "high"],
                ["moderate", "high", "critical"],
                ["high", "critical", "critical"],
            ],
            "bands_summary": {
                "low": qs.filter(priority_score__lt=0.4).count(),
                "moderate": qs.filter(priority_score__gte=0.4, priority_score__lt=0.6).count(),
                "high": qs.filter(priority_score__gte=0.6, priority_score__lt=0.8).count(),
                "critical": qs.filter(priority_score__gte=0.8).count(),
            },
            "total_habitations": qs.count(),
        })
