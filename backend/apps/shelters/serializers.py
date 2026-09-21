import json
from rest_framework import serializers
from .models import Shelter


class ShelterSerializer(serializers.ModelSerializer):
    """
    Shelter serializer with:
    - location as GeoJSON Point dict (frontend Leaflet needs this)
    - free_capacity as computed property
    - occupancy as alias for current_occupancy (frontend uses occupancy)
    """
    location = serializers.SerializerMethodField()
    free_capacity = serializers.IntegerField(read_only=True)
    occupancy = serializers.SerializerMethodField()

    class Meta:
        model = Shelter
        fields = [
            "id", "name", "type", "location",
            "capacity", "current_occupancy", "occupancy", "free_capacity",
            "medical_support", "water_kl", "sanitation_ok",
            "operational", "managed_by", "amenities", "updated_at",
        ]

    def get_location(self, obj):
        """Return GeoJSON Point dict for Leaflet compatibility."""
        if obj.location:
            return {
                "type": "Point",
                "coordinates": [obj.location.x, obj.location.y],
            }
        return None

    def get_occupancy(self, obj):
        """Alias: frontend uses 'occupancy' not 'current_occupancy'."""
        return obj.current_occupancy
