from django.urls import path
from .views import DistrictListView, DistrictDetailView
urlpatterns = [path("", DistrictListView.as_view()), path("<int:pk>/", DistrictDetailView.as_view())]
