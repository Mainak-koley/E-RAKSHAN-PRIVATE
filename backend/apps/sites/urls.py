from django.urls import path
from .views import SiteListView, SiteDetailView, SiteCapacityView

urlpatterns = [
    path("", SiteListView.as_view(), name="site-list"),
    path("<str:pk>/", SiteDetailView.as_view(), name="site-detail"),
    path("<str:pk>/capacity/", SiteCapacityView.as_view(), name="site-capacity"),
]
