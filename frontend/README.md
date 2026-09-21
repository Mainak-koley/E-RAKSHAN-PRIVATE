# E-Rakshan — Hazard-to-Relocation Decision Support Platform

**district-scale disaster decision-support prototype (frontend)**

E-Rakshan converts heterogeneous geospatial & incident data into *prioritised evacuation and
shelter-allocation decisions*, implementing the full documented decision chain:

```
Hazard → Vulnerability → Priority → Safe Site → Capacity → Route → Optimised Relocation Decision
```

The UI follows the platform architecture poster: a dark navy command console with cyan / teal,
lime-green, orange and purple accents. OSIRIS (Operational Situation & Risk Intelligence System)
is treated as the intelligence-aggregation layer, exactly as recommended in the solution document.

---

## ✨ Interactive modules

| Route | Module | What you can do |
|---|---|---|
| `/dashboard` | **Command Dashboard** | KPIs, live situational ticker, mini tactical map, simulation triggers (rainfall slider, road blockage, SOS burst), OSIRIS telemetry |
| `/map` | **Tactical Map** | Leaflet map with 8 toggleable layers, evidence popups with inline actions, incident drop-pin mode, road blockage simulation, animated OSIRIS live tracks, basemap switcher, opacity controls |
| `/habitations` | **Habitations** | Search / filter / sort the settlement register, export CSV, per-settlement explainable risk breakdown drawer |
| `/risk` | **Red-Zone Indexer** | Tune the 6 hazard-factor weights → every score, band, zone and KPI recomputes live; hazard × vulnerability matrix; dynamic red-zone list with severity drift |
| `/relocation` | **Relocation Engine** | Pick source settlements, tune MILP objective weights & constraints, run the capacity-constrained solver with an animated convergence trace, view assignment routes on the map |
| `/sites` | **Safe Sites** | Suitability scoring (30/20/15/15/10/10 framework), amenity filters, fly-to on map |
| `/capacity` | **Shelter Capacity** | Interactive occupancy gauges (±25/±100, sliders), close/reopen shelters, network pressure alerts |
| `/optimization` | **Optimiser (MILP)** | Compare strategy presets (balanced / speed / safety / comfort), convergence chart, post-allocation utilisation, export plan |
| `/field` | **Field Reports** | Submit geo-referenced reports, drive the unverified → verified → responding → resolved pipeline, watch OSIRIS confidence rise on verification |
| `/alerts` | **Alert Center** | Live mock-WebSocket feed, severity/status filters, acknowledge & resolve, test-burst injection, OSIRIS source register |
| `/reports` | **Incident Reports** | Report builder, printable situation report (print stylesheet = clean PDF), CSV export with decision log |
| `/admin` | **Administration** | Commander-only RBAC console: team roles, feed cadence, scenario events, basemap defaults |

**Demo logins** (also autofill buttons on the login page):

| Persona | Email | Password |
|---|---|---|
| District Commander | `commander@erakshan.in` | `demo123` |
| Field Officer | `field@erakshan.in` | `demo123` |
| Risk Analyst | `analyst@erakshan.in` | `demo123` |

---

## 🧠 Analytics engines (in-browser, mirroring the backend design)

* **Hazard score** — weighted blend of normalised rainfall, slope, river proximity, drainage
  deficit, relative elevation and historical events. Banded per the documented classification:
  `0–0.25 Monitor · 0.25–0.5 Prepare · 0.5–0.75 Issue Warning · 0.75–1.0 Evacuate/Relocate`.
* **Priority index** — `0.45·hazard + 0.35·vulnerability + 0.20·exposure` (vulnerability blends
  elderly/children/disabled share, fragile housing, no-vehicle share, hospital access).
* **Relocation solver** — capacity-constrained allocation (greedy initial + pair-swap
  improvement) honouring: capacity caps, operational status, medical matching, max travel
  distance, red-zone route exposure and road-blockage penalties — with the mandated
  infeasibility fallback (overflow, flagged shortfall, temporary-shelter recommendation,
  escalation alert).
* **OSIRIS confidence** — `reliability × recency × verification × authority`; citizen reports
  never auto-create red zones until verified.
* **Isolation detection** — settlements whose *every* connecting road is blocked are flagged
  `ISOLATED — NO SAFE LAND ROUTE` and escalated.

## 🗂 Demo dataset

`public/demo-data/*.geojson` — 36 habitations, 7 dynamic red zones, 12 safe sites,
14 shelters, 20 road segments and 8 incidents over a realistic **Wayanad (Kerala)**
layout (Chooralmala–Mundakkai slope, Banasura, Panamaram, Kabani lowlands…).
Regenerate with `python3 scripts/generate_demo_data.py` (seeded, reproducible).

Data gaps are disclosed in-UI, per the research doc: census counts are labelled estimates,
shelter capacities are labelled simulated/needs-verification, CCTV is optional.

## 🚀 Quickstart

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build` → `npm run preview`.

No backend is required — `VITE_DEMO_MODE=true` serves everything from the mock layer.
To attach the FastAPI backend later, copy `.env.example` → `.env` and set:

```
VITE_DEMO_MODE=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/events
```

The API surface (`services/api/endpoints.js`) mirrors the recommended backend:
`/hazards/current`, `/settlements/priorities`, `/shelters`, `/relocation/solve`,
`/incidents`, `/routes/{o}/{d}`, `WS /events`.

## 🧱 Stack

React 18 · Vite 5 · React Router 6 · Leaflet 1.9 · Recharts · lucide-react · hand-rolled
design system (`src/styles/*.css`) using the poster's palette.

## 📁 Structure

```
src/
├── components/   common · layout · maps · charts · risk · habitations
│                 relocation · sites · shelters · field · alerts · reports
├── pages/        auth · dashboard · map · habitations · risk · relocation
│                 sites · capacity · optimization · field · alerts · reports · admin
├── context/      AuthContext · AppContext · MapContext · AlertContext · DemoContext
├── services/     api (client, endpoints) · mock · websocket · providers
├── data/         demo (scenario) · geojson (loaders) · schemas
├── hooks/ utils/ constants/ routes/ styles/
└── App.jsx · main.jsx
```

> Demo prototype for Smart India Hackathon 2026 — all data is simulated; not for operational use.
