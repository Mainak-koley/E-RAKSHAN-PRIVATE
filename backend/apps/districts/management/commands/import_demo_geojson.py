"""
Management command: import_demo_geojson
Imports E-Rakshan frontend demo GeoJSON files into PostGIS.

Usage:
    python manage.py import_demo_geojson --district raigad
    python manage.py import_demo_geojson --district wayanad
    python manage.py import_demo_geojson --district raigad --frontend /path/to/e-rakshan-frontend
"""
import json
from pathlib import Path

from django.contrib.gis.geos import GEOSGeometry, Point
from django.core.management.base import BaseCommand

from apps.districts.models import District
from apps.habitations.models import Habitation
from apps.hazards.models import RedZone
from apps.incidents.models import Incident
from apps.infrastructure.models import Road
from apps.shelters.models import Shelter
from apps.sites.models import RelocationSite


def _f(val, default=0.0):
    """Safe float conversion."""
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def _i(val, default=0):
    """Safe int conversion."""
    try:
        return int(float(val)) if val is not None else default
    except (TypeError, ValueError):
        return default


def _b(val, default=False):
    """Safe bool conversion."""
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ("true", "1", "yes")
    return bool(val) if val is not None else default


class Command(BaseCommand):
    help = "Import E-Rakshan frontend demo GeoJSON data into PostGIS"

    def add_arguments(self, parser):
        parser.add_argument(
            "--district",
            required=True,
            choices=["raigad", "wayanad"],
            help="Which demo district to import",
        )
        parser.add_argument(
            "--frontend",
            default=None,
            help="Path to the e-rakshan-frontend folder (auto-detected if not set)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            default=False,
            help="Delete all existing data for this district before importing",
        )

    def handle(self, *args, **opts):
        district_name = opts["district"]

        # ── Auto-detect frontend path ──────────────────────────────────────
        if opts["frontend"]:
            frontend = Path(opts["frontend"])
        else:
            # Walk up from this file to find the frontend folder
            candidates = [
                Path(__file__).resolve().parents[5].parent / "e-rakshan-frontend",
                Path(__file__).resolve().parents[5].parent / "E-Rakshan-Git",
                Path(__file__).resolve().parents[6] / "e-rakshan-frontend",
                Path(__file__).resolve().parents[6] / "E-Rakshan-Git",
            ]
            frontend = next((p for p in candidates if (p / "public" / "demo-data").exists()), None)
            if not frontend:
                self.stderr.write(self.style.ERROR(
                    "Cannot auto-detect frontend folder. Pass --frontend /path/to/frontend"
                ))
                return

        base = frontend / "public" / "demo-data" / district_name

        if not base.exists():
            self.stderr.write(self.style.ERROR(f"Demo data folder not found: {base}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Using demo data from: {base}"))

        # ── Create / get district ──────────────────────────────────────────
        state = "Maharashtra" if district_name == "raigad" else "Kerala"
        center_map = {
            "raigad": [18.42, 73.19],
            "wayanad": [11.72, 76.13],
        }
        district, created = District.objects.get_or_create(
            name=district_name.title(),
            defaults={
                "state": state,
                "center_lat": center_map[district_name][0],
                "center_lng": center_map[district_name][1],
                "default_zoom": 10 if district_name == "raigad" else 11,
            },
        )
        if not created:
            # Update state/center in case they were missing
            district.state = state
            district.save(update_fields=["state"])

        action = "Created" if created else "Found"
        self.stdout.write(f"{action} district: {district.name} ({district.state})")

        # ── Optionally clear existing data ────────────────────────────────
        if opts["clear"]:
            self.stdout.write(self.style.WARNING(f"Clearing existing data for {district.name}…"))
            Habitation.objects.filter(district=district).delete()
            RedZone.objects.filter(district=district).delete()
            Shelter.objects.filter(district=district).delete()
            RelocationSite.objects.filter(district=district).delete()
            Road.objects.filter(district=district).delete()
            Incident.objects.filter(district=district).delete()

        # ── Import each layer ──────────────────────────────────────────────
        self._import_habitations(base, district)
        self._import_redzones(base, district)
        self._import_shelters(base, district)
        self._import_safe_sites(base, district)
        self._import_roads(base, district)
        self._import_incidents(base, district)

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Import complete for {district.name}. Run risk recalculation next:\n"
            f"   python manage.py recalculate_risk --district {district.pk}"
        ))

    # ── HABITATIONS ───────────────────────────────────────────────────────

    def _import_habitations(self, base, district):
        path = base / "habitations.geojson"
        if not path.exists():
            self.stdout.write(self.style.WARNING("habitations.geojson not found — skipped"))
            return

        data = json.loads(path.read_text(encoding="utf-8"))
        count = 0
        for idx, feature in enumerate(data.get("features", []), 1):
            p = feature.get("properties") or {}
            geom = feature.get("geometry")
            if not geom or geom.get("type") != "Point":
                continue

            g = GEOSGeometry(json.dumps(geom), srid=4326)
            obj_id = str(p.get("id") or f"HAB-{idx:02d}")

            Habitation.objects.update_or_create(
                id=obj_id,
                defaults={
                    "district": district,
                    "name": p.get("name", obj_id),
                    "panchayath": p.get("panchayath", ""),
                    "location": g,
                    # Population
                    "population": _i(p.get("population", p.get("pop", 0))),
                    "households": _i(p.get("households", 0)),
                    # Terrain / hazard fields
                    "elevation_m": _f(p.get("elevation_m", p.get("elevation", 0))),
                    "slope_deg": _f(p.get("slope_deg", p.get("slope", 0))),
                    "dist_river_km": _f(p.get("dist_river_km", p.get("dist_river", 99))),
                    "drainage_index": _f(p.get("drainage_index", p.get("drainage", 0))),
                    "hist_events": _i(p.get("hist_events", p.get("historical", 0))),
                    # Rainfall (24h mm) — used in risk calc
                    "rainfall24_mm": _f(p.get("rainfall24_mm", p.get("rainfall24", 0))),
                    # Vulnerability / demographic fields (stored as 0–100 %)
                    "elderly_pct": _f(p.get("elderly_pct", p.get("elderly", 0))),
                    "children_pct": _f(p.get("children_pct", p.get("children", 0))),
                    "disabled_pct": _f(p.get("disabled_pct", p.get("disabled", 0))),
                    "fragile_housing_pct": _f(p.get("fragile_housing_pct", p.get("fragile_housing", 0))),
                    "no_vehicle_pct": _f(p.get("no_vehicle_pct", p.get("no_vehicle", 0))),
                    "dist_hospital_km": _f(p.get("dist_hospital_km", p.get("dist_hospital", 0))),
                    # Exposure
                    "event_exposure": _f(p.get("event_exposure", 0)),
                },
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"  Habitations: {count} imported"))

    # ── RED ZONES ─────────────────────────────────────────────────────────

    def _import_redzones(self, base, district):
        path = base / "redzones.geojson"
        if not path.exists():
            self.stdout.write(self.style.WARNING("redzones.geojson not found — skipped"))
            return

        data = json.loads(path.read_text(encoding="utf-8"))
        count = 0
        for idx, feature in enumerate(data.get("features", []), 1):
            p = feature.get("properties") or {}
            geom = feature.get("geometry")
            if not geom or geom.get("type") != "Polygon":
                continue

            g = GEOSGeometry(json.dumps(geom), srid=4326)
            obj_id = str(p.get("id") or f"RZ-{idx:02d}")

            severity = _f(p.get("severity", p.get("current_severity", 0)))
            base_sev = _f(p.get("base_severity", severity))

            RedZone.objects.update_or_create(
                id=obj_id,
                defaults={
                    "district": district,
                    "name": p.get("name", obj_id),
                    "hazard_type": p.get("hazard_type", p.get("type", "Unknown")),
                    "boundary": g,
                    "base_severity": base_sev,
                    "current_severity": severity,
                    "probability": _f(p.get("probability", 0)),
                    "population_exposed": _i(p.get("population_exposed", 0)),
                    "active": _b(p.get("active", True)),
                },
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"  Red zones: {count} imported"))

    # ── SHELTERS ──────────────────────────────────────────────────────────

    def _import_shelters(self, base, district):
        path = base / "shelters.geojson"
        if not path.exists():
            self.stdout.write(self.style.WARNING("shelters.geojson not found — skipped"))
            return

        data = json.loads(path.read_text(encoding="utf-8"))
        count = 0
        for idx, feature in enumerate(data.get("features", []), 1):
            p = feature.get("properties") or {}
            geom = feature.get("geometry")
            if not geom or geom.get("type") != "Point":
                continue

            g = GEOSGeometry(json.dumps(geom), srid=4326)
            obj_id = str(p.get("id") or f"SHL-{idx:02d}")

            Shelter.objects.update_or_create(
                id=obj_id,
                defaults={
                    "district": district,
                    "name": p.get("name", obj_id),
                    "type": p.get("type", ""),
                    "location": g,
                    "capacity": _i(p.get("capacity", 0)),
                    "current_occupancy": _i(p.get("current_occupancy", p.get("occupancy", 0))),
                    "medical_support": _b(p.get("medical_support", p.get("medical", False))),
                    "water_kl": _f(p.get("water_kl", p.get("water", 0))),
                    "sanitation_ok": _b(p.get("sanitation_ok", p.get("sanitation", True))),
                    "operational": _b(p.get("operational", True)),
                    "managed_by": p.get("managed_by", ""),
                    # amenities stored as list
                    "amenities": p.get("amenities", []) if isinstance(p.get("amenities"), list) else [],
                },
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"  Shelters: {count} imported"))

    # ── SAFE SITES ────────────────────────────────────────────────────────

    def _import_safe_sites(self, base, district):
        path = base / "safe-sites.geojson"
        if not path.exists():
            self.stdout.write(self.style.WARNING("safe-sites.geojson not found — skipped"))
            return

        data = json.loads(path.read_text(encoding="utf-8"))
        count = 0
        for idx, feature in enumerate(data.get("features", []), 1):
            p = feature.get("properties") or {}
            geom = feature.get("geometry")
            if not geom:
                continue

            g = GEOSGeometry(json.dumps(geom), srid=4326)
            obj_id = str(p.get("id") or f"SITE-{idx:02d}")

            # GeoJSON uses snake_case 0–1 floats (e.g. hazard_safety: 0.9)
            # We store them as 0–1 and expose as 0–100 in the serializer
            hazard_safety = _f(p.get("hazard_safety", p.get("hazard_safety_score", 0)))
            capacity_sc   = _f(p.get("capacity_score", p.get("capacity", 0)))
            connectivity  = _f(p.get("connectivity", p.get("connectivity_score", 0)))
            terrain       = _f(p.get("terrain", p.get("terrain_score", 0)))
            livelihood    = _f(p.get("livelihood", p.get("livelihood_score", 0)))
            services      = _f(p.get("services", p.get("services_score", 0)))

            # Overall suitability: stored in GeoJSON as 0–100
            suitability = _f(p.get("suitability", p.get("overall_suitability", 0)))

            # amenities must be a list
            amenities = p.get("amenities", [])
            if not isinstance(amenities, list):
                amenities = []

            RelocationSite.objects.update_or_create(
                id=obj_id,
                defaults={
                    "district": district,
                    "name": p.get("name", obj_id),
                    "type": p.get("type", ""),
                    "location": g,
                    "area_ha": _f(p.get("area_ha", 0)),
                    # Store as 0–1 floats
                    "hazard_safety_score": hazard_safety,
                    "capacity_score": capacity_sc,
                    "connectivity_score": connectivity,
                    "terrain_score": terrain,
                    "livelihood_score": livelihood,
                    "services_score": services,
                    # Overall suitability stored as 0–100 (matches GeoJSON)
                    "overall_suitability": suitability,
                    "amenities": amenities,
                    "verification_note": p.get("verification", ""),
                },
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"  Safe sites: {count} imported"))

    # ── ROADS ─────────────────────────────────────────────────────────────

    def _import_roads(self, base, district):
        path = base / "roads.geojson"
        if not path.exists():
            self.stdout.write(self.style.WARNING("roads.geojson not found — skipped"))
            return

        data = json.loads(path.read_text(encoding="utf-8"))
        count = 0
        for idx, feature in enumerate(data.get("features", []), 1):
            p = feature.get("properties") or {}
            geom = feature.get("geometry")
            if not geom or geom.get("type") != "LineString":
                continue

            g = GEOSGeometry(json.dumps(geom), srid=4326)
            obj_id = str(p.get("id") or f"RD-{idx:02d}")

            # connects: list of habitation names or IDs
            connects = p.get("connects", [])
            if not isinstance(connects, list):
                connects = []

            Road.objects.update_or_create(
                id=obj_id,
                defaults={
                    "district": district,
                    "name": p.get("name", obj_id),
                    "road_class": p.get("class", p.get("road_class", "")),
                    "path": g,
                    "status": p.get("status", "open"),
                    "flood_depth_cm": _f(p.get("flood_depth_cm", 0)),
                    "surface": p.get("surface", ""),
                    "connects_habitations": connects,
                },
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"  Roads: {count} imported"))

    # ── INCIDENTS ─────────────────────────────────────────────────────────

    def _import_incidents(self, base, district):
        path = base / "incidents.geojson"
        if not path.exists():
            self.stdout.write(self.style.WARNING("incidents.geojson not found — skipped"))
            return

        data = json.loads(path.read_text(encoding="utf-8"))
        count = 0
        for idx, feature in enumerate(data.get("features", []), 1):
            p = feature.get("properties") or {}
            geom = feature.get("geometry")
            if not geom or geom.get("type") != "Point":
                continue

            g = GEOSGeometry(json.dumps(geom), srid=4326)
            obj_id = str(p.get("id") or f"INC-{idx:02d}")

            Incident.objects.update_or_create(
                id=obj_id,
                defaults={
                    "district": district,
                    "incident_type": p.get("type", p.get("incident_type", "Unknown")),
                    "severity": p.get("severity", "medium"),
                    "status": p.get("status", "unverified"),
                    "location": g,
                    "location_name": p.get("location_name", p.get("name", "")),
                    "description": p.get("description", ""),
                    "source": p.get("source", "demo"),
                    "confidence": _f(p.get("confidence", 0.5)),
                    "authority_confirmed": _b(p.get("authority_confirmed", False)),
                },
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"  Incidents: {count} imported"))
