# 🛡️ E-RAKSHAN (इ-रक्षण)
### Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations

**Smart India Hackathon 2026 (SIH 2026)**  
**Problem Statement ID:** SIH26191  
**Organization:** Ministry of Home Affairs, Government of India  
**Domain:** Disaster Preparedness & Management  

---

## 📖 Executive Summary

**E-RAKSHAN** is an advanced operational decision-support platform engineered for district disaster management authorities (DDMA), incident commanders, field officers, and risk analysts. It unifies real-time geospatial intelligence, dynamic multi-factor vulnerability assessment, automated capacity optimization, and an AI-driven hands-free operational voice assistant (**SAI**) into a single, cohesive command centre.

---

## 🏗️ System Architecture

```
                                  E-RAKSHAN PLATFORM
 ┌────────────────────────────────────────────────────────────────────────────────┐
 │                               FRONTEND LAYER                                   │
 │   React 18 + Vite · Tactical Leaflet GIS · Real-time WebSocket Event Feed     │
 │   Role-based Command (Commander, Field Officer, Risk Analyst)                 │
 └───────────────────────┬────────────────────────────────┬───────────────────────┘
                         │ REST / WebSocket               │ Audio WebSocket
                         ▼                                ▼
 ┌──────────────────────────────────────────────┐ ┌───────────────────────────────┐
 │               DJANGO BACKEND                 │ │      SAI VOICE BRIDGE         │
 │   Django 5.2 · GeoDjango · PostGIS           │ │   FastAPI · PyAudio           │
 │   Django REST Framework · Daphne (ASGI)      │ │   Local TTS / STT engine      │
 │   Celery Worker & Celery Beat Scheduler      │ │   Ollama LLM Fallback         │
 └──────┬────────────────────────┬──────────────┘ └───────────────────────────────┘
        │                        │
        ▼                        ▼
 ┌──────────────┐         ┌──────────────┐
 │  PostgreSQL  │         │ Redis 7      │
 │  + PostGIS   │         │ (Broker/WS)  │
 └──────────────┘         └──────────────┘
        ▲                        ▲
 ┌──────┴────────────────────────┴──────────────┐
 │            EXTERNAL DATA INGESTION           │
 │   Open-Meteo (24h Rainfall & Weather API)    │
 │   USGS Hazards (Real-time Seismic Feed)      │
 └──────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```text
E-RAKSHAN-PRIVATE/
├── frontend/                 # React 18 / Vite Tactical Web Application
│   ├── src/                  # Components, GIS layers, pages, and state context
│   │   ├── components/       # Maps, charts, tables, and SAI Assistant UI
│   │   ├── pages/            # Dashboard, Map, Relocation, Capacity, Field reports
│   │   └── services/         # API client, WebSocket stream, mock fallbacks
│   ├── public/demo-data/     # Raigad & Wayanad GeoJSON benchmark datasets
│   └── package.json
│
├── backend/                  # Django 5.2 GeoDjango REST Backend
│   ├── apps/                 # 14 Modular Django Applications
│   │   ├── accounts/         # JWT Auth, demo user seeding (Commander, Field, Analyst)
│   │   ├── alerts/           # Real-time WebSocket notifications (Channels)
│   │   ├── audit/            # SHA-256 tamper-evident cryptographic decision log
│   │   ├── districts/        # District boundaries & high-level KPIs
│   │   ├── habitations/      # Settlement demographics, isolation, and priorities
│   │   ├── hazards/          # Dynamic Red Zones & active hazard tracking
│   │   ├── incidents/        # Crowdsourced & authority-verified field incidents
│   │   ├── infrastructure/   # Road networks, flood depths, route risk engine
│   │   ├── ingestion/        # Open-Meteo & USGS automated data feeds
│   │   ├── intelligence/     # Multi-criteria risk engine & vulnerability scoring
│   │   ├── relocation/       # Constrained optimization engine (Greedy + Pair-swap)
│   │   ├── reports/          # Situation briefings & automated CSV exports
│   │   ├── shelters/         # Relief shelters, occupancy, resources & water
│   │   └── sites/            # Safe relocation land parcels & suitability scoring
│   ├── config/               # Settings, ASGI routing, Celery schedules
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
│
├── voice-bridge/             # SAI Hands-Free Voice Assistant Microservice
│   ├── voice/                # Speech-to-Text (STT) & Text-to-Speech (TTS)
│   ├── main.py               # FastAPI WebSocket audio bridge
│   └── requirements.txt
│
├── docker-compose.yml        # Multi-container orchestration (PostGIS, Redis, Backend, Celery)
├── .gitignore                # Production gitignore (excludes .venv, node_modules, .env)
└── README.md
```

---

## ⚡ Key Features

1. **Intelligent Hazard-Based Red Zones**: Dynamic polygons that expand/contract based on real-time rainfall, slope stability, and river proximity.
2. **Multi-Factor Vulnerability Scoring**: Normalized indices accounting for elderly share, children, disabled population, fragile housing types, and hospital distance.
3. **Constrained Relocation Solver**: Solves settlement-to-shelter allocation respecting travel distance constraints, road flood risks, and medical penalties with convergence traces.
4. **Hands-Free Tactical Voice Assistant (SAI)**: Responds to *"Hey SAI"* with situational summaries, free bed counts, isolated habitation queries, and evacuation advice.
5. **Live Ingestion Feeds**: Auto-fetches precipitation from Open-Meteo and seismic activity from USGS.
6. **Cryptographic Decision Audit Trail**: Every evacuation order generates a SHA-256 hash ensuring tamper-evident accountability.

---

## 🚀 Quick Start Guide

### Method 1: Using Docker (Recommended)

1. Ensure **Docker Desktop** is running.
2. Launch the backend, PostGIS database, and Redis broker:
   ```bash
   docker compose up -d
   ```
3. Initialize the database and load demo datasets:
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed_demo_users
   docker compose exec backend python manage.py import_demo_geojson --district raigad
   docker compose exec backend python manage.py recalculate_risk
   ```
4. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### Method 2: Manual Local Setup

#### Backend:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_users
python manage.py import_demo_geojson --district raigad
python manage.py recalculate_risk
python manage.py runserver 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

#### Voice Bridge (Optional):
```bash
cd voice-bridge
pip install -r requirements.txt
python -m uvicorn main:app --port 8787 --reload
```

---

## 👥 Demo User Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Incident Commander** | `commander@erakshan.in` | `demo123` | Full operational command, relocation solver, alert broadcasting |
| **Field Officer** | `field@erakshan.in` | `demo123` | Incident submission, road status updates, shelter reporting |
| **Risk Analyst** | `analyst@erakshan.in` | `demo123` | Vulnerability parameter weighting, reports, GIS exports |

---

## 🛡️ License
Built for the Smart India Hackathon 2026. Ministry of Home Affairs, Government of India.
