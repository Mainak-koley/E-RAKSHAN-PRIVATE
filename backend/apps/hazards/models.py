from django.contrib.gis.db import models
from apps.districts.models import District

class HazardEvent(models.Model):
    HAZARDS = [("flood","Flood"),("landslide","Landslide"),("cloudburst","Cloudburst"),("erosion","Coastal erosion"),("lightning","Lightning")]
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="hazard_events")
    hazard_type = models.CharField(max_length=30, choices=HAZARDS)
    severity = models.FloatField(default=0)
    probability = models.FloatField(default=0)
    location = models.GeometryField(srid=4326, null=True, blank=True)
    source = models.CharField(max_length=120, blank=True)
    confidence = models.FloatField(default=.5)
    observed_at = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)

class RedZone(models.Model):
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="red_zones")
    id = models.CharField(max_length=40, primary_key=True)
    name = models.CharField(max_length=180)
    hazard_type = models.CharField(max_length=30)
    boundary = models.PolygonField(srid=4326)
    base_severity = models.FloatField(default=0)
    current_severity = models.FloatField(default=0)
    probability = models.FloatField(default=0)
    population_exposed = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
