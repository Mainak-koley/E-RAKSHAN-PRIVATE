from django.contrib.gis.db import models
from apps.districts.models import District
class Shelter(models.Model):
    id=models.CharField(max_length=40,primary_key=True)
    district=models.ForeignKey(District,on_delete=models.CASCADE,related_name="shelters")
    name=models.CharField(max_length=180)
    type=models.CharField(max_length=80,blank=True)
    location=models.PointField(srid=4326)
    capacity=models.PositiveIntegerField(default=0)
    current_occupancy=models.PositiveIntegerField(default=0)
    medical_support=models.BooleanField(default=False)
    water_kl=models.FloatField(default=0)
    sanitation_ok=models.BooleanField(default=True)
    operational=models.BooleanField(default=True)
    managed_by=models.CharField(max_length=180,blank=True)
    amenities=models.JSONField(default=dict,blank=True)
    updated_at=models.DateTimeField(auto_now=True)
    @property
    def free_capacity(self): return max(0,self.capacity-self.current_occupancy)
