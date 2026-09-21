from django.contrib.gis.db import models
from apps.districts.models import District
class Road(models.Model):
    STATUS=[("open","Open"),("blocked","Blocked"),("caution","Caution")]
    id=models.CharField(max_length=40,primary_key=True)
    district=models.ForeignKey(District,on_delete=models.CASCADE,related_name="roads")
    name=models.CharField(max_length=180)
    road_class=models.CharField(max_length=50,blank=True)
    path=models.LineStringField(srid=4326)
    status=models.CharField(max_length=20,choices=STATUS,default="open")
    flood_depth_cm=models.FloatField(default=0)
    surface=models.CharField(max_length=80,blank=True)
    connects_habitations=models.JSONField(default=list,blank=True)
