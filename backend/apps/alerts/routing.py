from django.urls import re_path
from .consumers import EventsConsumer

websocket_urlpatterns = [
    re_path(r"^ws/events/?$", EventsConsumer.as_asgi()),
    re_path(r"^events/?$", EventsConsumer.as_asgi()),
    re_path(r"^api/v1/events/?$", EventsConsumer.as_asgi()),
]
