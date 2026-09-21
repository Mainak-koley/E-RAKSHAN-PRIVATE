"""
WebSocket consumer for E-Rakshan real-time event stream.
Connects at: ws://localhost:8000/ws/events/

Features:
- On connect: sends initial snapshot of active alerts + telemetry
- Broadcasts alert / telemetry events pushed via channel layer
- Client can send {"type": "ping"} to keep connection alive
"""
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async


class EventsConsumer(AsyncJsonWebsocketConsumer):
    GROUP_NAME = "erakshan_events"

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()
        # Send connected + initial snapshot
        await self.send_json({
            "type": "connected",
            "message": "E-Rakshan event stream connected",
        })
        snapshot = await self._get_snapshot()
        await self.send_json({"type": "snapshot", "payload": snapshot})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")
        if msg_type == "ping":
            await self.send_json({"type": "pong"})

    # ── Group message handlers ────────────────────────────────────────────

    async def alert_push(self, event):
        """Receives alert_push messages from channel layer and forwards to client."""
        await self.send_json({"type": "alert", "payload": event["payload"]})

    async def telemetry_push(self, event):
        """Receives telemetry_push messages from channel layer and forwards to client."""
        await self.send_json({"type": "telemetry", "payload": event["payload"]})

    # ── Helpers ───────────────────────────────────────────────────────────

    @database_sync_to_async
    def _get_snapshot(self):
        from apps.alerts.models import Alert
        from apps.alerts.serializers import AlertSerializer
        active = Alert.objects.filter(status__in=["new", "acknowledged"]).order_by("-issued_at")[:20]
        return {
            "active_alerts": AlertSerializer(active, many=True).data,
        }
