import pytest
from django.contrib.gis.geos import Point
from apps.districts.models import District
from apps.habitations.models import Habitation
from apps.intelligence.services import recalculate_habitation
@pytest.mark.django_db
def test_risk_recalculation():
    d=District.objects.create(name="Test",state="Test")
    h=Habitation.objects.create(id="H-1",district=d,name="Test",location=Point(73,18),population=100,slope_deg=30,dist_river_km=.5,hist_events=2,elderly_pct=.1,children_pct=.1,disabled_pct=.05,fragile_housing_pct=.2,no_vehicle_pct=.3,dist_hospital_km=5)
    recalculate_habitation(h)
    assert 0 <= h.priority_score <= 1
    assert h.risk_band in {"low","moderate","high","critical"}
