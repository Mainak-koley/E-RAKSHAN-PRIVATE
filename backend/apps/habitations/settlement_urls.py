from django.urls import path
from .views import SettlementPrioritiesView, HabitationListView

urlpatterns = [
    path("priorities/", SettlementPrioritiesView.as_view(), name="settlement-priorities"),
    path("", HabitationListView.as_view(), name="settlement-list"),
]

