from django.db import models
from apps.habitations.models import Habitation
from apps.shelters.models import Shelter
class RelocationPlan(models.Model):
    status=models.CharField(max_length=20,default="shortfall")
    total_population=models.PositiveIntegerField(default=0)
    assigned_population=models.PositiveIntegerField(default=0)
    unassigned_population=models.PositiveIntegerField(default=0)
    objective_cost=models.FloatField(default=0)
    convergence_trace=models.JSONField(default=list,blank=True)
    warnings=models.JSONField(default=list,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
class RelocationAssignment(models.Model):
    plan=models.ForeignKey(RelocationPlan,on_delete=models.CASCADE,related_name="assignments")
    source_habitation=models.ForeignKey(Habitation,on_delete=models.CASCADE)
    target_shelter=models.ForeignKey(Shelter,on_delete=models.CASCADE)
    population_allocated=models.PositiveIntegerField(default=0)
    distance_km=models.FloatField(default=0)
    route_risk=models.FloatField(default=0)
    blocked_route_encountered=models.BooleanField(default=False)
    overflow_engaged=models.BooleanField(default=False)
