from rest_framework import serializers
from .models import RelocationPlan, RelocationAssignment


class RelocationAssignmentSerializer(serializers.ModelSerializer):
    sourceId = serializers.CharField(source="source_habitation_id", read_only=True)
    sourceName = serializers.CharField(source="source_habitation.name", read_only=True)
    shelterId = serializers.CharField(source="target_shelter_id", read_only=True)
    shelterName = serializers.CharField(source="target_shelter.name", read_only=True)
    population = serializers.IntegerField(source="population_allocated", read_only=True)
    distanceKm = serializers.FloatField(source="distance_km", read_only=True)
    routeRisk = serializers.FloatField(source="route_risk", read_only=True)

    class Meta:
        model = RelocationAssignment
        fields = [
            "id", "plan",
            "source_habitation", "sourceId", "sourceName",
            "target_shelter", "shelterId", "shelterName",
            "population_allocated", "population",
            "distance_km", "distanceKm",
            "route_risk", "routeRisk",
            "overflow_engaged",
        ]


class RelocationPlanSerializer(serializers.ModelSerializer):
    assignments = RelocationAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = RelocationPlan
        fields = "__all__"
