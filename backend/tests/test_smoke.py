import pytest
from django.urls import reverse
@pytest.mark.django_db
def test_api_root(client):
    response=client.get("/api/v1/")
    assert response.status_code in (200,401)
