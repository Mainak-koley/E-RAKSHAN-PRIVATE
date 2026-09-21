from django.contrib.gis.db import models
from apps.districts.models import District
class Alert(models.Model):
    SEVERITY=[("info","Info"),("warning","Warning"),("critical","Critical")]
    STATUS=[("new","New"),("acknowledged","Acknowledged"),("resolved","Resolved")]
    district=models.ForeignKey(District,on_delete=models.CASCADE,related_name="alerts")
    alert_type=models.CharField(max_length=80)
    severity=models.CharField(max_length=20,choices=SEVERITY)
    source=models.CharField(max_length=120)
    message=models.TextField()
    affected_area=models.GeometryField(srid=4326,null=True,blank=True)
    confidence=models.FloatField(default=.5)
    status=models.CharField(max_length=20,choices=STATUS,default="new")
    issued_at=models.DateTimeField()
    expires_at=models.DateTimeField(null=True,blank=True)
