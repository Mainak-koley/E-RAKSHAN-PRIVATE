import json
from rest_framework import serializers
from .models import HazardEvent, RedZone


class HazardEventSerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()

    class Meta:
        model = HazardEvent
        fields = "__all__"

    def get_location(self, obj):
        if obj.location:
            return json.loads(obj.location.geojson)
        return None


class RedZoneSerializer(serializers.ModelSerializer):
    boundary = serializers.SerializerMethodField()
    # severity alias for frontend compatibility
    severity = serializers.FloatField(source="current_severity", read_only=True)

    class Meta:
        model = RedZone
        fields = [
            "id", "name", "hazard_type", "boundary",
            "base_severity", "current_severity", "severity",
            "probability", "population_exposed", "active",
            "valid_from", "valid_until",
        ]

    def get_boundary(self, obj):
        if obj.boundary:
            return json.loads(obj.boundary.geojson)
        return None
