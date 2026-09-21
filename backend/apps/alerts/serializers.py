from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    # Alias: frontend uses 'type' not 'alert_type'
    type = serializers.CharField(source="alert_type", read_only=True)
    # time alias: frontend expects 'time' not 'issued_at'
    time = serializers.DateTimeField(source="issued_at", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id", "district",
            "alert_type", "type",
            "severity", "source", "message",
            "confidence", "status",
            "issued_at", "time", "expires_at",
        ]
