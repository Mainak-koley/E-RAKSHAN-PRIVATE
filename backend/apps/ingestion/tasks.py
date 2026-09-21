"""
Celery tasks for external data ingestion (Open-Meteo & USGS).
"""
import logging
from celery import shared_task
from apps.districts.models import District
from .services import fetch_weather_for_district, fetch_usgs_earthquakes

logger = logging.getLogger(__name__)


@shared_task(name="tasks.sync_weather_all_districts")
def sync_weather_all_districts():
    """
    Periodic task to fetch Open-Meteo weather data for all registered districts.
    """
    logger.info("Starting periodic weather sync for all districts...")
    results = []
    for district in District.objects.all():
        res = fetch_weather_for_district(district)
        results.append(res)
    logger.info(f"Weather sync complete: {len(results)} districts processed.")
    return results


@shared_task(name="tasks.sync_usgs_earthquakes")
def sync_usgs_earthquakes():
    """
    Periodic task to fetch recent earthquakes from USGS feed.
    """
    logger.info("Starting USGS earthquake sync...")
    events = fetch_usgs_earthquakes(min_magnitude=3.0)
    logger.info(f"USGS earthquake sync complete: {len(events)} events processed.")
    return {"events_count": len(events)}

