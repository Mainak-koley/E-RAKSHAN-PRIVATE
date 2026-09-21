from django.urls import path
from .views import AlertListCreateView, AlertDetailView, AlertAcknowledgeView, AlertResolveView

urlpatterns = [
    path("", AlertListCreateView.as_view(), name="alert-list"),
    path("<int:pk>/", AlertDetailView.as_view(), name="alert-detail"),
    path("<int:pk>/acknowledge/", AlertAcknowledgeView.as_view(), name="alert-acknowledge"),
    path("<int:pk>/resolve/", AlertResolveView.as_view(), name="alert-resolve"),
]
