# E-Rakshan Backend

Django REST + PostgreSQL/PostGIS backend for E-Rakshan.

## 1. Fastest Windows setup

Recommended: Docker Desktop.

```powershell
cd C:\Users\Bhoomi\Desktop\E-Rakshan
# Extract this backend folder here so the path is:
# C:\Users\Bhoomi\Desktop\E-Rakshan\backend

cd backend
copy .env.example .env
docker compose up --build
```

Then open:

- API root: http://127.0.0.1:8000/api/v1/
- Swagger: http://127.0.0.1:8000/api/docs/
- Django admin: http://127.0.0.1:8000/admin/

Create an admin:
```powershell
docker compose exec backend python manage.py createsuperuser
```

## 2. Seed frontend GeoJSON

If the React project is at:
`C:\Users\Bhoomi\Desktop\E-Rakshan\e-rakshan-frontend`

then:

```powershell
docker compose exec backend python manage.py import_demo_geojson --district raigad
docker compose exec backend python manage.py import_demo_geojson --district wayanad
```

The importer looks for:
`../e-rakshan-frontend/public/demo-data/<district>/`

## 3. Local Python setup without Docker

PostGIS/GeoDjango on Windows requires native GIS libraries. Docker is strongly recommended.

If PostgreSQL/PostGIS is already installed and configured, create `.env`, point DB settings at it, then:

```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 4. Important safety/design rules

- Unverified citizen reports never automatically create official red zones.
- Operational recommendations are deterministic backend calculations.
- SAI may query/explain/recommend, but does not autonomously execute irreversible emergency actions.
- `src/services/sahay/ollamaClient.js` is outside this backend and should remain unchanged.
- External feeds are adapters; credentials belong in environment variables.
- Simulated data must be labeled as simulation/demo.

## 5. Main API groups

`/api/v1/auth/`
`/api/v1/dashboard/`
`/api/v1/districts/`
`/api/v1/habitations/`
`/api/v1/risk/`
`/api/v1/hazards/`
`/api/v1/shelters/`
`/api/v1/sites/`
`/api/v1/roads/`
`/api/v1/incidents/`
`/api/v1/alerts/`
`/api/v1/relocation/`
`/api/v1/routes/`
`/api/v1/gis/`
`/api/v1/sai/`
`/api/v1/decisions/`
`/api/v1/reports/`
`/api/v1/search/`
