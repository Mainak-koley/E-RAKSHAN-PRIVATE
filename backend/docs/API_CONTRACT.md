# E-Rakshan API contract

Base URL: `/api/v1/`

## Frontend integration priority

1. `/auth/login/`, `/auth/me/`
2. `/dashboard/summary/`
3. `/districts/`
4. `/gis/layers/`
5. `/habitations/`
6. `/risk/matrix/`, `/risk/recalculate/`
7. `/shelters/`
8. `/sites/`
9. `/roads/`
10. `/incidents/`
11. `/alerts/`
12. `/relocation/solve/`
13. `/reports/situation-summary/`
14. `/sai/briefing/`, `/sai/query/`

Coordinates are GeoJSON order: `[longitude, latitude]`.

## Demo vs real

The backend supports the frontend demo GeoJSON as a seed source. Dynamic simulation and external ingestion should be treated as separate adapters and clearly labeled.
