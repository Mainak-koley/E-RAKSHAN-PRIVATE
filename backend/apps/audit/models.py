from django.db import models
from apps.accounts.models import User
class DecisionLog(models.Model):
    user=models.ForeignKey(User,on_delete=models.SET_NULL,null=True)
    event_type=models.CharField(max_length=100)
    recommendation=models.TextField()
    decision=models.CharField(max_length=30)
    reasoning=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    audit_hash=models.CharField(max_length=128,blank=True)
