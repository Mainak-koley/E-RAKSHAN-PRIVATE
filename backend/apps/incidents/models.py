from django.contrib.gis.db import models
from apps.districts.models import District
from apps.accounts.models import User
class Incident(models.Model):
    STATUS=[("unverified","Unverified"),("verified","Verified"),("responding","Responding"),("resolved","Resolved")]
    id=models.CharField(max_length=40,primary_key=True)
    district=models.ForeignKey(District,on_delete=models.CASCADE,related_name="incidents")
    incident_type=models.CharField(max_length=80)
    severity=models.CharField(max_length=20,default="medium")
    status=models.CharField(max_length=20,choices=STATUS,default="unverified")
    location=models.PointField(srid=4326)
    location_name=models.CharField(max_length=180,blank=True)
    description=models.TextField(blank=True)
    source=models.CharField(max_length=80,default="citizen")
    confidence=models.FloatField(default=.5)
    authority_confirmed=models.BooleanField(default=False)
    reported_by=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="incidents_reported")
    verified_by=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="incidents_verified")
    reported_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
