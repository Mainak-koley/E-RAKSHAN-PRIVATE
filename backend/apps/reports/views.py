"""
Reports app views: Situation summary, comprehensive report, and CSV export.
"""
import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.districts.models import District
from apps.habitations.models import Habitation
from apps.incidents.models import Incident
from apps.shelters.models import Shelter
from apps.relocation.models import RelocationPlan, RelocationAssignment
from apps.hazards.models import RedZone
from apps.intelligence.services import situation_summary


class SituationReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        d = District.objects.filter(pk=district_id).first() if district_id else District.objects.first()
        return Response({
            "report_type": "situation_summary",
            "district": d.name if d else "All",
            "data": situation_summary(d),
        })


class ComprehensiveReportView(APIView):
    """
    GET /api/v1/reports/comprehensive/?district=<id>
    Compiles full operational picture for reporting (risk, incidents, assignments, shelters).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        district = District.objects.filter(pk=district_id).first() if district_id else District.objects.first()

        hab_qs = Habitation.objects.filter(district=district) if district else Habitation.objects.all()
        inc_qs = Incident.objects.filter(district=district) if district else Incident.objects.all()
        sh_qs = Shelter.objects.filter(district=district) if district else Shelter.objects.all()
        rz_qs = RedZone.objects.filter(district=district, active=True) if district else RedZone.objects.filter(active=True)

        latest_plan = RelocationPlan.objects.order_by("-created_at").first()
        assignments = []
        if latest_plan:
            assignments = list(
                RelocationAssignment.objects.filter(plan=latest_plan).values(
                    "source_habitation__name", "target_shelter__name",
                    "population_allocated", "distance_km", "route_risk", "overflow_engaged"
                )
            )

        return Response({
            "district": district.name if district else "National Summary",
            "summary": situation_summary(district),
            "priority_habitations": list(
                hab_qs.order_by("-priority_score").values(
                    "id", "name", "priority_score", "hazard_score",
                    "vulnerability_score", "exposure_score", "risk_band",
                    "population", "is_isolated"
                )[:20]
            ),
            "active_red_zones": list(
                rz_qs.values("id", "name", "hazard_type", "current_severity", "population_exposed")
            ),
            "active_incidents": list(
                inc_qs.exclude(status="resolved").values(
                    "id", "incident_type", "severity", "status",
                    "location_name", "confidence", "reported_at"
                )
            ),
            "shelters_status": list(
                sh_qs.values(
                    "id", "name", "capacity", "current_occupancy",
                    "operational", "medical_support", "water_kl"
                )
            ),
            "relocation_plan": {
                "status": latest_plan.status if latest_plan else "no_plan",
                "total_population": latest_plan.total_population if latest_plan else 0,
                "assigned_population": latest_plan.assigned_population if latest_plan else 0,
                "warnings": latest_plan.warnings if latest_plan else [],
                "assignments": assignments,
            },
        })


class ExportCSVReportView(APIView):
    """
    GET /api/v1/reports/export-csv/?district=<id>
    Generates downloadable CSV containing priority habitations, incidents, and relocation assignments.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        district = District.objects.filter(pk=district_id).first() if district_id else District.objects.first()

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="erakshan-situation-report-{district.name if district else "all"}.csv"'

        writer = csv.writer(response)
        writer.writerow(["Section", "Item", "Details", "Action / Status", "Score / Population"])

        # Priorities
        hab_qs = Habitation.objects.filter(district=district) if district else Habitation.objects.all()
        for h in hab_qs.order_by("-priority_score")[:15]:
            writer.writerow([
                "Priority Habitation",
                h.name,
                f"Hazard: {h.hazard_score:.2f}, Vuln: {h.vulnerability_score:.2f}",
                f"Band: {h.risk_band} {'(ISOLATED)' if h.is_isolated else ''}",
                f"Priority: {h.priority_score:.2f} (Pop: {h.population})"
            ])

        # Incidents
        inc_qs = Incident.objects.filter(district=district) if district else Incident.objects.all()
        for inc in inc_qs.exclude(status="resolved"):
            writer.writerow([
                "Incident",
                inc.incident_type,
                inc.location_name,
                f"Status: {inc.status} ({inc.severity})",
                f"Confidence: {inc.confidence:.2f}"
            ])

        # Assignments
        latest_plan = RelocationPlan.objects.order_by("-created_at").first()
        if latest_plan:
            for asg in RelocationAssignment.objects.filter(plan=latest_plan):
                writer.writerow([
                    "Relocation Assignment",
                    f"{asg.source_habitation.name} -> {asg.target_shelter.name}",
                    f"Dist: {asg.distance_km:.1f} km, Risk: {asg.route_risk:.2f}",
                    "Overflow" if asg.overflow_engaged else "Normal",
                    f"{asg.population_allocated} people"
                ])

        return response
