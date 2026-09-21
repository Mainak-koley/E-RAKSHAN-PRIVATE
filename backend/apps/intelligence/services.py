"""
E-Rakshan Risk Intelligence Services
=====================================
Risk formula mirrors the frontend riskEngine.js so backend and frontend
always agree on scores.

Habitation fields are stored as:
  - pct fields (elderly_pct, etc.)  → 0–100  (percent)
  - dist_river_km                   → km
  - drainage_index                  → 0–1
  - rainfall24_mm                   → mm (24-hour)
  - elevation_m                     → metres
  - slope_deg                       → degrees
"""


def clamp01(x):
    return max(0.0, min(1.0, float(x or 0)))


# ---------------------------------------------------------------------------
# Hazard score   (mirrors frontend DEFAULT_HAZARD_WEIGHTS)
# ---------------------------------------------------------------------------
# Weights:  rainfall 0.25 | slope 0.20 | riverProximity 0.20
#           drainage 0.15 | lowElevation 0.10 | historical 0.10

def calculate_hazard(h):
    # Rainfall: cap at 180 mm extreme
    rainfall = clamp01(h.rainfall24_mm / 180.0)

    # Slope: cap at 40°
    slope = clamp01(h.slope_deg / 40.0)

    # River proximity: ≤ 3.5 km = full exposure
    river = clamp01(1 - h.dist_river_km / 3.5)

    # Drainage deficit: inverse of drainage index
    drainage = clamp01(1 - h.drainage_index)

    # Elevation: 0 m → high risk (coastal/floodplain), 1000 m → low
    elevation = clamp01(1 - h.elevation_m / 1000.0)

    # Historical events: cap at 6 events
    historical = clamp01(h.hist_events / 6.0)

    score = (
        0.25 * rainfall
        + 0.20 * slope
        + 0.20 * river
        + 0.15 * drainage
        + 0.10 * elevation
        + 0.10 * historical
    )
    return round(score, 4)


# ---------------------------------------------------------------------------
# Vulnerability score   (mirrors frontend DEFAULT_VULN_WEIGHTS)
# ---------------------------------------------------------------------------
# Weights:  vulnerableShare 0.40 | fragileHousing 0.25
#           noVehicle 0.20      | hospitalAccess 0.15

def calculate_vulnerability(h):
    # Vulnerable share = (elderly + children + disabled) / 300 → 0–1
    # pct fields are 0–100 each, so sum can be up to 300
    vulnerable_share = clamp01((h.elderly_pct + h.children_pct + h.disabled_pct) / 300.0)

    fragile = clamp01(h.fragile_housing_pct / 100.0)
    no_vehicle = clamp01(h.no_vehicle_pct / 100.0)

    # Hospital access: further = more vulnerable, cap 20 km
    hospital = clamp01(h.dist_hospital_km / 20.0)

    score = (
        0.40 * vulnerable_share
        + 0.25 * fragile
        + 0.20 * no_vehicle
        + 0.15 * hospital
    )
    return round(score, 4)


# ---------------------------------------------------------------------------
# Exposure score
# ---------------------------------------------------------------------------

def calculate_exposure(h, district_max_pop=None):
    """
    Population exposure relative to the largest habitation in the district.
    If district_max_pop not provided, falls back to a fixed reference.
    """
    ref = district_max_pop or max(1, h.analysis.get("district_population_reference", 50000))
    return round(clamp01(h.population / ref), 4)


# ---------------------------------------------------------------------------
# Priority score   (mirrors frontend PRIORITY_WEIGHTS)
# ---------------------------------------------------------------------------
# hazard 0.45 | vulnerability 0.35 | exposure 0.20

def risk_band_for(priority):
    if priority >= 0.80:
        return "critical"
    if priority >= 0.60:
        return "high"
    if priority >= 0.40:
        return "moderate"
    return "low"


def recalculate_habitation(h, district_max_pop=None):
    hazard = calculate_hazard(h)
    vuln = calculate_vulnerability(h)
    exposure = calculate_exposure(h, district_max_pop)
    priority = round(0.45 * hazard + 0.35 * vuln + 0.20 * exposure, 4)
    band = risk_band_for(priority)

    h.hazard_score = hazard
    h.vulnerability_score = vuln
    h.exposure_score = exposure
    h.priority_score = priority
    h.risk_band = band
    h.analysis = {
        **h.analysis,
        "factors": {
            "hazard": hazard,
            "vulnerability": vuln,
            "exposure": exposure,
            "priority": priority,
        },
        "formula": "0.45*hazard + 0.35*vulnerability + 0.20*exposure",
    }
    h.save(update_fields=[
        "hazard_score", "vulnerability_score", "exposure_score",
        "priority_score", "risk_band", "analysis", "updated_at",
    ])
    return h


def recalculate_all(district=None):
    """
    Recalculate risk scores for all habitations (optionally filtered by district).
    Returns count of updated records.
    """
    from apps.habitations.models import Habitation

    qs = Habitation.objects.filter(district=district) if district else Habitation.objects.all()
    habitations = list(qs)

    # Pre-compute district max population for relative exposure
    max_pop = max((h.population for h in habitations), default=1)

    for h in habitations:
        recalculate_habitation(h, district_max_pop=max_pop)

    return len(habitations)


# ---------------------------------------------------------------------------
# Explain habitation (used by SAI + HabitationExplainView)
# ---------------------------------------------------------------------------

def explain_habitation(h):
    return {
        "habitation_id": h.id,
        "name": h.name,
        "hazard_score": h.hazard_score,
        "vulnerability_score": h.vulnerability_score,
        "exposure_score": h.exposure_score,
        "priority_score": h.priority_score,
        "band": h.risk_band,
        "is_isolated": h.is_isolated,
        "factors": h.analysis.get("factors", {}),
        "formula": h.analysis.get("formula", ""),
        "inputs": {
            "rainfall24_mm": h.rainfall24_mm,
            "slope_deg": h.slope_deg,
            "dist_river_km": h.dist_river_km,
            "elevation_m": h.elevation_m,
            "elderly_pct": h.elderly_pct,
            "children_pct": h.children_pct,
            "disabled_pct": h.disabled_pct,
            "fragile_housing_pct": h.fragile_housing_pct,
            "no_vehicle_pct": h.no_vehicle_pct,
            "dist_hospital_km": h.dist_hospital_km,
            "population": h.population,
        },
    }


# ---------------------------------------------------------------------------
# Situation summary (used by SAI briefing + DashboardSummaryView)
# ---------------------------------------------------------------------------

def situation_summary(district):
    from apps.habitations.models import Habitation
    from apps.shelters.models import Shelter

    if not district:
        return {"message": "No district selected"}

    hs = Habitation.objects.filter(district=district)
    sh = Shelter.objects.filter(district=district)

    operational_shelters = sh.filter(operational=True)
    free_beds = sum(max(0, s.capacity - s.current_occupancy) for s in operational_shelters)

    return {
        "district": district.name,
        "district_id": district.pk,
        "critical_habitations": hs.filter(priority_score__gte=0.80).count(),
        "high_habitations": hs.filter(priority_score__gte=0.60, priority_score__lt=0.80).count(),
        "highest_priority": (
            hs.order_by("-priority_score")
            .values("id", "name", "priority_score", "risk_band")
            .first()
        ),
        "free_beds": free_beds,
        "operational_shelters": operational_shelters.count(),
        "isolated_habitations": hs.filter(is_isolated=True).count(),
    }
