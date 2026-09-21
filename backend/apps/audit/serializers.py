from rest_framework import serializers
from .models import DecisionLog
class DecisionLogSerializer(serializers.ModelSerializer):
    class Meta: model=DecisionLog; fields="__all__"; read_only_fields=["user","audit_hash"]
