from django.urls import path
from .views import SolveView, PlanListView, PlanDetailView, AssignmentListView

urlpatterns = [
    path("solve/", SolveView.as_view(), name="relocation-solve"),
    path("plans/", PlanListView.as_view(), name="relocation-plans"),
    path("plans/<int:pk>/", PlanDetailView.as_view(), name="relocation-plan-detail"),
    path("assignments/", AssignmentListView.as_view(), name="relocation-assignments"),
]
