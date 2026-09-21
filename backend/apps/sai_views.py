"""
SAI (System for AI Assistance) — Backend API endpoints
=======================================================
SAI is the E-Rakshan voice/text assistant.
Previously called SAHAY; renamed to SAI.

Endpoints:
  GET /api/v1/sai/briefing/   — operational situation briefing
  GET /api/v1/sai/query/      — dispatch operational queries
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.districts.models import District
from apps.intelligence.services import situation_summary, explain_habitation


class SAIBriefingView(APIView):
    """
    GET /api/v1/sai/briefing/?district=<id>
    Returns a structured situation briefing for SAI to read out.
    Matches the frontend SahayAssistant.jsx expected response schema.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        if district_id:
            district = District.objects.filter(pk=district_id).first()
        else:
            district = District.objects.order_by("name").first()

        if not district:
            return Response({"message": "No district data available."})

        return Response(situation_summary(district))


class SAIQueryView(APIView):
    """
    GET /api/v1/sai/query/?q=<text>&district=<id>
    Handles operational queries routed from the frontend SAI command engine.
    Backend handles data-intensive queries; fallback goes to Ollama.

    Supported query intents:
    - brief / situation / status  → situation summary
    - shelter capacity / free beds → shelter capacity data
    - critical habitations → list critical habitations
    - isolated → isolation status
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip().lower()
        district_id = request.query_params.get("district")

        district = None
        if district_id:
            district = District.objects.filter(pk=district_id).first()
        if not district:
            district = District.objects.order_by("name").first()

        # ── Briefing queries ──────────────────────────────────────────────
        if any(kw in q for kw in ["brief", "situation", "status", "what is happening", "update"]):
            return Response({
                "matched": True,
                "intent": "briefing",
                **situation_summary(district),
            })

        # ── Shelter capacity queries ──────────────────────────────────────
        if any(kw in q for kw in ["shelter", "bed", "capacity", "free bed", "available"]):
            summary = situation_summary(district)
            return Response({
                "matched": True,
                "intent": "shelter_capacity",
                "free_beds": summary["free_beds"],
                "operational_shelters": summary["operational_shelters"],
                "district": summary["district"],
            })

        # ── Critical habitations query ────────────────────────────────────
        if any(kw in q for kw in ["critical", "priority", "rescue", "evacuate", "habitation"]):
            from apps.habitations.models import Habitation
            qs = Habitation.objects.filter(district=district, priority_score__gte=0.60
                                           ).order_by("-priority_score")[:5]
            return Response({
                "matched": True,
                "intent": "priority_habitations",
                "habitations": list(qs.values("id", "name", "priority_score", "risk_band", "population")),
            })

        # ── Isolation query ───────────────────────────────────────────────
        if any(kw in q for kw in ["isolated", "no route", "blocked", "road"]):
            from apps.habitations.models import Habitation
            qs = Habitation.objects.filter(district=district, is_isolated=True)
            return Response({
                "matched": True,
                "intent": "isolation",
                "isolated_count": qs.count(),
                "isolated": list(qs.values("id", "name")),
            })

        # ── Fallback ──────────────────────────────────────────────────────
        return Response({
            "matched": False,
            "message": (
                "Operational query not recognized by the backend. "
                "Deterministic commands are handled in the SAI command engine. "
                "Open-ended questions may be routed to Ollama."
            ),
        })
