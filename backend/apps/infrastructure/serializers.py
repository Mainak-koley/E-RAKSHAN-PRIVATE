import json
from rest_framework import serializers
from .models import Road


class RoadSerializer(serializers.ModelSerializer):
    path = serializers.SerializerMethodField()
    # connects alias (frontend uses 'connects', model stores 'connects_habitations')
    connects = serializers.JSONField(source="connects_habitations", read_only=True)

    class Meta:
        model = Road
        fields = [
            "id", "name", "road_class", "path",
            "status", "flood_depth_cm", "surface",
            "connects_habitations", "connects",
        ]

    def get_path(self, obj):
        if obj.path:
            return json.loads(obj.path.geojson)
        return None
