from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Roles(models.TextChoices):
        COMMANDER = "commander", "Commander"
        FIELD = "field", "Field Officer"
        ANALYST = "analyst", "Analyst"
        CITIZEN = "citizen", "Citizen"
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.ANALYST)
    name = models.CharField(max_length=150, blank=True)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
