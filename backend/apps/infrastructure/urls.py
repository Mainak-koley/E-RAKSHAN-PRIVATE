from django.urls import path
from .views import RoadListView, RoadDetailView, RoadStatusView, RouteCalculationView

urlpatterns = [
    path("", RoadListView.as_view(), name="road-list"),
    path("<str:pk>/", RoadDetailView.as_view(), name="road-detail"),
    path("<str:pk>/status/", RoadStatusView.as_view(), name="road-status"),
    path("<str:origin>/<str:destination>/", RouteCalculationView.as_view(), name="route-calculate"),
]
