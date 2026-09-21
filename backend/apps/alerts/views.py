"""
Alerts views — list, acknowledge, resolve, and live WebSocket broadcast.
"""
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Alert
from .serializers import AlertSerializer

logger = logging.getLogger(__name__)


def broadcast_alert_to_ws(alert_data: dict):
    """Broadcast an alert event to all active WebSocket listeners."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "erakshan_events",
                {
                    "type": "alert_push",
                    "payload": alert_data,
                },
            )
    except Exception as exc:
        logger.warning(f"Could not broadcast alert to WebSocket: {exc}")


class AlertListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Alert.objects.all().order_by("-issued_at")
        d = self.request.query_params.get("district")
        s = self.request.query_params.get("status")
        severity = self.request.query_params.get("severity")
        if d:
            qs = qs.filter(district_id=d)
        if s:
            qs = qs.filter(status=s)
        if severity:
            qs = qs.filter(severity=severity)
        return qs

    def perform_create(self, serializer):
        alert = serializer.save(issued_at=timezone.now())
        broadcast_alert_to_ws(AlertSerializer(alert).data)


class AlertDetailView(generics.RetrieveUpdateAPIView):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]


class AlertAcknowledgeView(APIView):
    """PATCH /alerts/<pk>/acknowledge/ — mark alert as acknowledged."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response({"error": "Alert not found"}, status=404)

        if alert.status == "new":
            alert.status = "acknowledged"
            alert.save(update_fields=["status"])

        data = AlertSerializer(alert).data
        broadcast_alert_to_ws(data)
        return Response(data)


class AlertResolveView(APIView):
    """PATCH /alerts/<pk>/resolve/ — mark alert as resolved."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response({"error": "Alert not found"}, status=404)

        alert.status = "resolved"
        alert.save(update_fields=["status"])
        data = AlertSerializer(alert).data
        broadcast_alert_to_ws(data)
        return Response(data)
