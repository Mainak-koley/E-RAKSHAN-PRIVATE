from django.contrib.gis.db import models
from apps.districts.models import District


class RelocationSite(models.Model):
    id = models.CharField(max_length=40, primary_key=True)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="sites")
    name = models.CharField(max_length=180)
    type = models.CharField(max_length=100, blank=True)
    location = models.GeometryField(srid=4326)
    area_ha = models.FloatField(default=0)

    # Suitability factor scores stored as 0–1 float
    hazard_safety_score = models.FloatField(default=0)
    capacity_score = models.FloatField(default=0)
    connectivity_score = models.FloatField(default=0)
    terrain_score = models.FloatField(default=0)
    livelihood_score = models.FloatField(default=0)
    services_score = models.FloatField(default=0)

    # Overall suitability: stored as 0–100 (matches frontend GeoJSON convention)
    overall_suitability = models.FloatField(default=0)

    # amenities stored as list e.g. ["water", "sanitation", "power"]
    amenities = models.JSONField(default=list, blank=True)

    # Field verification note
    verification_note = models.CharField(max_length=300, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-overall_suitability"]

    def __str__(self):
        return f"{self.id} — {self.name}"
