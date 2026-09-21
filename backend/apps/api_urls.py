"""
Central /api/v1/ URL routing.
All routes match frontend contracts and aliases.
"""
from django.urls import include, path

from apps.districts.views import DashboardSummaryView, GISLayersView, SearchView
from apps.sai_views import SAIBriefingView, SAIQueryView
from apps.accounts.views import LoginView, MeView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # ── Authentication ────────────────────────────────────────────────────
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", MeView.as_view(), name="me"),

    # ── Dashboard ─────────────────────────────────────────────────────────
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),

    # ── Districts ─────────────────────────────────────────────────────────
    path("districts/", include(("apps.districts.urls", "districts"))),

    # ── Habitations & Settlements ─────────────────────────────────────────
    path("habitations/", include(("apps.habitations.urls", "habitations"))),
    # Alias: frontend calls /settlements/priorities
    path("settlements/", include(("apps.habitations.settlement_urls", "settlements"))),

    # ── Hazards & Red Zones ───────────────────────────────────────────────
    path("hazards/", include(("apps.hazards.urls", "hazards"))),
    # Alias: frontend calls /red-zones/ directly
    path("red-zones/", include(("apps.hazards.rz_urls", "red-zones"))),
    # Alias: frontend calls /hazard-events/ directly
    path("hazard-events/", include(("apps.hazards.ev_urls", "hazard-events"))),

    # ── Shelters ──────────────────────────────────────────────────────────
    path("shelters/", include(("apps.shelters.urls", "shelters"))),

    # ── Safe Sites ────────────────────────────────────────────────────────
    path("sites/", include(("apps.sites.urls", "sites"))),
    # Alias: frontend calls /safe-sites/ directly
    path("safe-sites/", include(("apps.sites.urls", "safe-sites"))),

    # ── Infrastructure (Roads & Routes) ───────────────────────────────────
    path("roads/", include(("apps.infrastructure.urls", "roads"))),
    # Alias: frontend calls /routes/:origin/:destination
    path("routes/", include(("apps.infrastructure.urls", "routes"))),

    # ── Incidents ─────────────────────────────────────────────────────────
    path("incidents/", include(("apps.incidents.urls", "incidents"))),

    # ── Alerts ────────────────────────────────────────────────────────────
    path("alerts/", include(("apps.alerts.urls", "alerts"))),

    # ── Relocation ────────────────────────────────────────────────────────
    path("relocation/", include(("apps.relocation.urls", "relocation"))),

    # ── Risk / Intelligence ───────────────────────────────────────────────
    path("risk/", include(("apps.intelligence.urls", "risk"))),

    # ── Ingestion (Open-Meteo, USGS, manual triggers) ─────────────────────
    path("ingestion/", include(("apps.ingestion.urls", "ingestion"))),

    # ── Audit & Decision Logs ─────────────────────────────────────────────
    path("decisions/", include(("apps.audit.urls", "audit"))),
    path("audit/", include(("apps.audit.urls", "audit-alias"))),

    # ── Reports & Exports ─────────────────────────────────────────────────
    path("reports/", include(("apps.reports.urls", "reports"))),

    # ── GIS Layers ────────────────────────────────────────────────────────
    path("gis/layers/", GISLayersView.as_view(), name="gis-layers"),

    # ── Search ────────────────────────────────────────────────────────────
    path("search/", SearchView.as_view(), name="search"),

    # ── SAI Voice / AI Assistant ──────────────────────────────────────────
    path("sai/briefing/", SAIBriefingView.as_view(), name="sai-briefing"),
    path("sai/query/", SAIQueryView.as_view(), name="sai-query"),
]
