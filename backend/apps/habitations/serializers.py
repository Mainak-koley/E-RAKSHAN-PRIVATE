from rest_framework import serializers
from .models import Habitation


class HabitationSerializer(serializers.ModelSerializer):
    """
    Habitation serializer.
    location is returned as {"type": "Point", "coordinates": [lng, lat]}
    for Leaflet / frontend compatibility.
    """
    location = serializers.SerializerMethodField()

    class Meta:
        model = Habitation
        fields = [
            "id", "name", "panchayath", "location",
            "population", "households",
            # Terrain / hazard inputs
            "elevation_m", "slope_deg", "dist_river_km",
            "drainage_index", "rainfall24_mm", "hist_events", "event_exposure",
            # Vulnerability / demographic inputs
            "elderly_pct", "children_pct", "disabled_pct",
            "fragile_housing_pct", "no_vehicle_pct", "dist_hospital_km",
            # Computed risk scores
            "hazard_score", "vulnerability_score", "exposure_score",
            "priority_score", "risk_band",
            # Status
            "is_isolated", "analysis", "updated_at",
        ]

    def get_location(self, obj):
        if obj.location:
            return {
                "type": "Point",
                "coordinates": [obj.location.x, obj.location.y],
            }
        return None
