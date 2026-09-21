from django.contrib.gis.db import models

class District(models.Model):
    name = models.CharField(max_length=120)
    state = models.CharField(max_length=120)
    center = models.PointField(srid=4326, null=True, blank=True)
    default_zoom = models.PositiveSmallIntegerField(default=10)
    active = models.BooleanField(default=True)
    telemetry = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.name}, {self.state}"
