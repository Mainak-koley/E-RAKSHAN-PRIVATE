import hashlib
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DecisionLog
from .serializers import DecisionLogSerializer


class DecisionLogListCreateView(generics.ListCreateAPIView):
    serializer_class = DecisionLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = DecisionLog.objects.all().order_by("-created_at")
        event_type = self.request.query_params.get("event_type")
        user_id = self.request.query_params.get("user")
        if event_type:
            qs = qs.filter(event_type=event_type)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save(user=self.request.user if self.request.user.is_authenticated else None)
        computed_hash = hashlib.sha256(
            f"{obj.user_id}|{obj.event_type}|{obj.recommendation}|"
            f"{obj.decision}|{obj.created_at.isoformat()}".encode()
        ).hexdigest()
        obj.audit_hash = computed_hash
        obj.save(update_fields=["audit_hash"])


class DecisionLogDetailView(generics.RetrieveAPIView):
    queryset = DecisionLog.objects.all()
    serializer_class = DecisionLogSerializer
    permission_classes = [IsAuthenticated]


class AuditVerifyView(APIView):
    """
    GET /api/v1/decisions/<pk>/verify/
    Cryptographic verification endpoint to prove decision integrity.
    Re-calculates SHA-256 hash and compares with stored audit_hash.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            log = DecisionLog.objects.get(pk=pk)
        except DecisionLog.DoesNotExist:
            return Response({"error": "Decision log entry not found"}, status=404)

        expected = hashlib.sha256(
            f"{log.user_id}|{log.event_type}|{log.recommendation}|"
            f"{log.decision}|{log.created_at.isoformat()}".encode()
        ).hexdigest()

        is_valid = (log.audit_hash == expected)

        return Response({
            "log_id": log.id,
            "stored_hash": log.audit_hash,
            "recomputed_hash": expected,
            "tamper_evident_valid": is_valid,
            "timestamp": log.created_at,
            "decision": log.decision,
            "event_type": log.event_type,
        })