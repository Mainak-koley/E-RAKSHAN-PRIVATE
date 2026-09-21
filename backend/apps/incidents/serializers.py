import json
from rest_framework import serializers
from .models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()
    # Alias: frontend uses 'type' for incident_type
    type = serializers.CharField(source="incident_type", read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id", "district", "incident_type", "type",
            "severity", "status", "location", "location_name",
            "description", "source", "confidence",
            "authority_confirmed", "reported_by", "verified_by",
            "reported_at",
        ]

    def get_location(self, obj):
        if obj.location:
            return json.loads(obj.location.geojson)
        return None
