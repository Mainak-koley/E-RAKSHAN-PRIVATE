from django.urls import path
from .views import *
urlpatterns=[path("recalculate/",RiskRecalculateView.as_view()),path("matrix/",RiskMatrixView.as_view())]
