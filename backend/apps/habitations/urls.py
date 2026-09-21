from django.urls import path
from .views import *
urlpatterns = [
 path("", HabitationListView.as_view()),
 path("<str:pk>/", HabitationDetailView.as_view()),
 path("<str:pk>/explain/", HabitationExplainView.as_view()),
 path("<str:pk>/accessibility/", HabitationAccessibilityView.as_view()),
]
