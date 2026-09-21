import json
from rest_framework import serializers
from .models import RelocationSite


class RelocationSiteSerializer(serializers.ModelSerializer):
    """
    Serializes RelocationSite to match frontend expectations exactly.
    Frontend SiteCard.jsx uses camelCase keys: hazardSafety, capacity,
    connectivity, terrain, livelihood, services, suitability.
    Factor scores are stored as 0–1 and exposed as 0–100 percentage.
    """
    location = serializers.SerializerMethodField()

    # camelCase factor fields matching frontend FACTOR_LABELS in SiteCard.jsx
    hazardSafety = serializers.SerializerMethodField()
    capacity = serializers.SerializerMethodField()
    connectivity = serializers.SerializerMethodField()
    terrain = serializers.SerializerMethodField()
    livelihood = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    suitability = serializers.SerializerMethodField()

    class Meta:
        model = RelocationSite
        fields = [
            "id", "name", "type", "location", "area_ha",
            # camelCase fields for frontend
            "hazardSafety", "capacity", "connectivity",
            "terrain", "livelihood", "services", "suitability",
            # snake_case originals still included for API completeness
            "hazard_safety_score", "capacity_score", "connectivity_score",
            "terrain_score", "livelihood_score", "services_score",
            "overall_suitability",
            "amenities", "verification_note", "updated_at",
        ]

    def get_location(self, obj):
        if obj.location:
            return json.loads(obj.location.geojson)
        return None

    # Factor scores as 0–100 (percentage) for frontend display
    def get_hazardSafety(self, obj):
        return round(obj.hazard_safety_score * 100, 1)

    def get_capacity(self, obj):
        return round(obj.capacity_score * 100, 1)

    def get_connectivity(self, obj):
        return round(obj.connectivity_score * 100, 1)

    def get_terrain(self, obj):
        return round(obj.terrain_score * 100, 1)

    def get_livelihood(self, obj):
        return round(obj.livelihood_score * 100, 1)

    def get_services(self, obj):
        return round(obj.services_score * 100, 1)

    def get_suitability(self, obj):
        # overall_suitability is already 0–100
        return round(obj.overall_suitability, 1)
