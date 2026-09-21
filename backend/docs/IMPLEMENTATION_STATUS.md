# Implementation status

## Included now
- Django/DRF project scaffold
- PostgreSQL/PostGIS Docker stack
- JWT authentication
- Core spatial models
- Basic REST endpoints
- Risk/vulnerability/exposure/priority service
- Relocation allocation service
- Incident verification/confidence
- Alerts + WebSocket skeleton
- SAI briefing/query endpoints
- GeoJSON demo importer
- Swagger/OpenAPI
- Basic tests
- Audit log

## Next implementation passes
- Match serializers exactly to the current React frontend schemas
- Port the frontend riskEngine.js formulas exactly after inspecting the live source
- Port optimizer.js exactly and replace the first-pass allocator with OR-Tools MILP
- Implement real route graph / shortest-safe-route
- Implement authenticated WebSocket JWT
- Implement real external adapters only after API contracts/credentials are confirmed
- Add Celery ingestion jobs
- Add PDF situation reports
- Add offline sync
- Connect frontend service layer
- Connect SAI command engine without modifying protected Ollama integration
