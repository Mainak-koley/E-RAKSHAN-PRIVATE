import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from apps.alerts.routing import websocket_urlpatterns
from apps.alerts.middleware import JWTWebSocketMiddleware

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTWebSocketMiddleware(URLRouter(websocket_urlpatterns)),
})
