"""
E-Rakshan Ingestion Services
=============================
Integrates with real public data feeds:
1. Open-Meteo Weather API (free, no API key required)
   Fetches current rainfall, wind speed, weather code for district center coordinates
   and updates Habitation rainfall24_mm.
2. USGS Earthquake Hazards API (free, no API key required)
   Fetches recent earthquake events near the Indian subcontinent and creates
   HazardEvent records.
3. Incident confidence calculation (OSIRIS Bayesian-inspired formula).
"""
import logging
from datetime import datetime, timezone
import requests
from django.contrib.gis.geos import Point

from apps.districts.models import District
from apps.habitations.models import Habitation
from apps.hazards.models import HazardEvent

logger = logging.getLogger(__name__)

# Reliability table for sources
RELIABILITY = {
    "weather_station": 0.95,
    "satellite": 0.92,
    "usgs": 0.95,
    "open_meteo": 0.90,
    "field_officer": 0.90,
    "cctv": 0.75,
    "citizen": 0.60,
    "demo": 0.70,
    "default": 0.50,
}


def confidence_for_incident(obj, reliability=None):
    """
    OSIRIS confidence scoring formula:
    Confidence = Reliability * Recency * Verification * Authority
    """
    rel = reliability if reliability is not None else RELIABILITY.get(obj.source, 0.50)
    recency = 1.0  # fresh report
    verification = {"unverified": 0.35, "verified": 0.90, "responding": 0.90, "resolved": 1.0}.get(obj.status, 0.35)
    authority = 1.0 if obj.authority_confirmed else 0.0
    return round(rel * (0.75 + 0.25 * recency) * (0.55 + 0.45 * verification) * (0.70 + 0.30 * authority), 4)


def normalize_record(record):
    return {
        "source": record.get("source", "unknown"),
        "observed_at": record.get("observed_at"),
        "location": record.get("location"),
        "type": record.get("type"),
        "severity": record.get("severity", 0),
        "metadata": record.get("metadata", {}),
    }


# ── Open-Meteo Weather Fetcher ──────────────────────────────────────────────

def fetch_weather_for_district(district: District) -> dict:
    """
    Fetches real-time weather and precipitation from Open-Meteo API
    for the center coordinates of a district.
    Updates rainfall24_mm on district habitations and triggers recalculation.
    """
    lat = district.center_lat
    lng = district.center_lng

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        "daily": "precipitation_sum,precipitation_hours,wind_speed_10m_max",
        "timezone": "Asia/Kolkata",
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current", {})
        daily = data.get("daily", {})

        # Extract 24-hour precipitation sum or current precipitation
        precip_24h = 0.0
        if daily.get("precipitation_sum") and len(daily["precipitation_sum"]) > 0:
            precip_24h = float(daily["precipitation_sum"][0] or 0.0)
        elif current.get("rain") is not None:
            precip_24h = float(current.get("rain") or 0.0)

        temp = current.get("temperature_2m")
        wind = current.get("wind_speed_10m")
        weather_code = current.get("weather_code", 0)

        # Update habitations in this district with current rainfall reading if non-zero
        if precip_24h > 0:
            Habitation.objects.filter(district=district).update(rainfall24_mm=precip_24h)
            from apps.intelligence.services import recalculate_all
            recalculate_all(district=district)

        # Create HazardEvent if precipitation or wind is extreme
        severity = 0.0
        if precip_24h >= 100 or (wind and wind > 60):
            severity = min(1.0, (precip_24h / 200.0) * 0.7 + ((wind or 0) / 100.0) * 0.3)
            HazardEvent.objects.create(
                district=district,
                hazard_type="heavy_rainfall" if precip_24h >= 100 else "gale_winds",
                severity=round(severity, 2),
                location=Point(lng, lat, srid=4326),
                source="open_meteo",
                observed_at=datetime.now(timezone.utc),
                metadata={
                    "rainfall_mm": precip_24h,
                    "temperature_c": temp,
                    "wind_kmh": wind,
                    "weather_code": weather_code,
                },
            )

        return {
            "status": "success",
            "district": district.name,
            "rainfall24_mm": precip_24h,
            "temperature_c": temp,
            "wind_speed_kmh": wind,
            "weather_code": weather_code,
            "timestamp": current.get("time"),
        }

    except Exception as exc:
        logger.warning(f"Open-Meteo fetch failed for {district.name}: {exc}")
        return {
            "status": "error",
            "district": district.name,
            "error": str(exc),
        }


# ── USGS Earthquake Hazards Fetcher ─────────────────────────────────────────

def fetch_usgs_earthquakes(min_magnitude=3.0) -> list[dict]:
    """
    Fetches real-time earthquake feeds from USGS (all earthquakes past 24 hours).
    Filters for Indian subcontinent bounding box (lat: 6.0 to 38.0, lng: 68.0 to 98.0)
    or magnitude >= 5.0 globally.
    Creates HazardEvent entries.
    """
    url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

    try:
        resp = requests.get(url, timeout=12)
        resp.raise_for_status()
        geojson = resp.json()

        events_created = []
        features = geojson.get("features", [])

        # Default district for regional seismic monitoring
        default_district = District.objects.order_by("id").first()

        for feat in features:
            props = feat.get("properties") or {}
            geom = feat.get("geometry") or {}
            coords = geom.get("coordinates") or []

            if len(coords) < 2:
                continue

            lng, lat = float(coords[0]), float(coords[1])
            mag = float(props.get("mag") or 0.0)

            # Check if inside South Asia / Indian bounding box or high magnitude
            in_region = (6.0 <= lat <= 38.0) and (68.0 <= lng <= 98.0)
            is_major = mag >= 5.5

            if (in_region and mag >= min_magnitude) or is_major:
                # Store external event id in metadata
                event = HazardEvent.objects.create(
                    district=default_district,
                    hazard_type="earthquake",
                    severity=severity,
                    location=Point(lng, lat, srid=4326),
                    source="usgs",
                    observed_at=datetime.now(timezone.utc),
                    metadata={
                        "external_id": feat.get("id", ""),
                        "magnitude": mag,
                        "place": props.get("place", "Unknown"),
                        "depth_km": coords[2] if len(coords) > 2 else 0,
                        "url": props.get("url", ""),
                        "time": props.get("time"),
                    },
                )
                created = True
                events_created.append({
                    "id": event.id,
                    "magnitude": mag,
                    "place": props.get("place"),
                    "coordinates": [lng, lat],
                    "severity": severity,
                    "created": created,
                })

        return events_created

    except Exception as exc:
        logger.warning(f"USGS Earthquake fetch failed: {exc}")
        return []
