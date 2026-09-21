from django.contrib.gis.db import models
from apps.districts.models import District


class Habitation(models.Model):
    id = models.CharField(max_length=40, primary_key=True)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="habitations")
    name = models.CharField(max_length=180)
    panchayath = models.CharField(max_length=180, blank=True)
    location = models.PointField(srid=4326)

    # Population
    population = models.PositiveIntegerField(default=0)
    households = models.PositiveIntegerField(default=0)

    # Terrain / hazard inputs
    elevation_m = models.FloatField(default=0)
    slope_deg = models.FloatField(default=0)
    dist_river_km = models.FloatField(default=99)
    drainage_index = models.FloatField(default=0)
    rainfall24_mm = models.FloatField(default=0)
    hist_events = models.PositiveIntegerField(default=0)
    event_exposure = models.FloatField(default=0)

    # Vulnerability / demographic inputs (stored as percentage 0–100)
    elderly_pct = models.FloatField(default=0)
    children_pct = models.FloatField(default=0)
    disabled_pct = models.FloatField(default=0)
    fragile_housing_pct = models.FloatField(default=0)
    no_vehicle_pct = models.FloatField(default=0)
    dist_hospital_km = models.FloatField(default=0)

    # Computed risk scores (set by intelligence/services.py)
    hazard_score = models.FloatField(default=0)
    vulnerability_score = models.FloatField(default=0)
    exposure_score = models.FloatField(default=0)
    priority_score = models.FloatField(default=0)
    risk_band = models.CharField(max_length=20, default="low")

    # Isolation status (updated when road statuses change)
    is_isolated = models.BooleanField(default=False)

    # Extra JSON for extended analysis metadata
    analysis = models.JSONField(default=dict, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority_score"]

    def __str__(self):
        return f"{self.id} — {self.name} ({self.risk_band})"
