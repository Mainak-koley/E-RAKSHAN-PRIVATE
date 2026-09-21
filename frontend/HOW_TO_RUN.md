# E-Rakshan + SAHAY — How to Run

This project has **3 independent pieces**:

| Piece | Required? | Gives you |
|---|---|---|
| 1. Frontend (React/Vite) | ✅ Always | The whole app — dashboard, map, SAHAY assistant UI |
| 2. Python voice bridge (`backend/`) | ✅ Required for mic/voice | SAHAY's microphone input and spoken replies (this build has **no browser-only fallback** — without this running, the mic button won't work at all) |
| 3. Ollama (local LLM) | Optional | SAHAY can answer general/open-ended questions, not just app commands |

---

## 0. Prerequisites

- **Node.js 18+** — https://nodejs.org (check: `node -v`)
- **Python 3.10+** — https://python.org (check: `python --version`) — needed for voice
- **Google Chrome or Microsoft Edge** — best browser support for this app

---

## 1. Run the frontend (required)

```bash
cd project
npm install
npm run dev
```

Open **http://localhost:5173**. Login with any of these demo accounts (also shown on the
login page as autofill buttons):

| Role | Email | Password |
|---|---|---|
| District Commander | `commander@erakshan.in` | `demo123` |
| Field Officer | `field@erakshan.in` | `demo123` |
| Risk Analyst | `analyst@erakshan.in` | `demo123` |

No database/backend needed for the app itself — `VITE_DEMO_MODE=true` means all data comes
from `public/demo-data/*.geojson` + in-browser mock engines.

---

## 2. Run the voice bridge (required for the microphone)

SAHAY's mic and spoken replies go through a small local Python service, not the browser
directly. **The app will run without it, but the mic button will not work at all** — it'll
just say "Local voice bridge is offline."

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8787
```

On Windows you can instead just double-click `backend\start_sahay_voice.bat`, which does
all of the above automatically.

Keep that terminal running. Once it's up, SAHAY's settings panel will show **"Local voice
bridge connected."**

**Before running this on a new machine, check/fix `backend/voice/input.py`:**
```python
MIC_DEVICE_INDEX = 1
```
This is hardcoded to one specific laptop's microphone from testing. On any other machine
this index may point to the wrong device (or nothing), and the mic will silently fail with
no error shown. Either remove `device_index=MIC_DEVICE_INDEX` from `sr.Microphone(...)` to
use the system default mic, or print `sr.Microphone.list_microphone_names()` once to find
the correct index for that machine.

**Common install issue:** `pip install pyaudio` can fail on Windows if there's no prebuilt
wheel for your Python version. If that happens, install a matching PyAudio wheel for your
Python version first, then re-run `pip install -r requirements.txt`.

---

## 3. Optional: Ollama (SAHAY's general-knowledge fallback)

SAHAY's command engine already handles app-specific requests (priorities, routes, shelters,
locating something on the map, navigation) with fixed logic — no AI needed for that. If
someone asks SAHAY something outside that scope, it asks a local Ollama model instead of
just saying "I don't understand."

1. Download & install Ollama: **https://ollama.com/download** (Windows/Mac/Linux)
2. Pull a small, fast model:
   ```bash
   ollama pull llama3.2
   ```
3. **Enable cross-origin access** so the browser (`localhost:5173`) can call Ollama
   (`localhost:11434`) — by default Ollama blocks this:
   - **Windows:** Search "Environment Variables" → New **User** variable →
     Name: `OLLAMA_ORIGINS`, Value: `*` → restart the Ollama app/service.
   - **Mac:** `launchctl setenv OLLAMA_ORIGINS "*"`, then restart Ollama.
   - **Linux:** `OLLAMA_ORIGINS=* ollama serve`
4. Restart `npm run dev` if it was already running, then ask SAHAY something like
   "how does a landslide happen?" — it should stream back a real answer.

This step is fully optional — skip it and SAHAY still does everything command-related.
Ollama not running just means general-knowledge questions get a polite "can't reach it"
message instead of an answer.

---

## 4. Environment variables (`.env`)

A `.env` already ships with working defaults. Copy `.env.example` → `.env` if starting
fresh. **Every `VITE_` variable gets baked into the public browser bundle at build time —
never put a real secret/API key behind a `VITE_` prefix.**

| Variable | Default | What it does |
|---|---|---|
| `VITE_APP_NAME` | `E-Rakshan` | App name shown in the UI |
| `VITE_APP_TAGLINE` | `Hazard-to-Relocation Decision Support` | Subtitle text |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Real backend API base — unused while `VITE_DEMO_MODE=true` |
| `VITE_WS_URL` | `ws://localhost:8000/api/v1/events` | Real backend events socket — unused in demo mode |
| `VITE_DEMO_MODE` | `true` | `true` = everything runs from in-browser mock data/engines, no backend needed. Set `false` only once a real FastAPI backend exists at `VITE_API_BASE_URL` |
| `VITE_DEFAULT_BASEMAP` | `dark` | Map style: `osm` \| `dark` \| `satellite` |
| `VITE_MOCK_WS_INTERVAL_MS` | `6000` | How often (ms) the demo mock feed fires simulated alerts/telemetry |
| `VITE_BHUVAN_PORTAL` | ISRO Bhuvan URL | Reference link shown in the UI |
| `VITE_FIRMS_PORTAL` | NASA FIRMS URL | Reference link shown in the UI |
| `VITE_OLLAMA_URL` | `http://localhost:11434` | Where the Ollama server is running |
| `VITE_OLLAMA_MODEL` | `llama3.2` | Must match a model you actually `ollama pull`-ed (check with `ollama list`) |
| `VITE_OLLAMA_ENABLED` | `true` | Set `false` to fully disable the Ollama fallback (SAHAY sticks to command-only answers) |
| `VITE_SAHAY_VOICE_WS` | `ws://127.0.0.1:8787/ws` | Address of the Python voice bridge from step 2 — must match the `--port` you run uvicorn with |

If you change `--port 8787` in step 2's uvicorn command, update `VITE_SAHAY_VOICE_WS`
here to match, or the frontend will never find the voice bridge.

---

## Troubleshooting

- **Mic button says "Local voice bridge is offline"** — the Python backend (step 2) isn't
  running, or crashed. Check that terminal for errors, and confirm `VITE_SAHAY_VOICE_WS`'s
  port matches the one uvicorn is actually listening on.
- **Backend runs but mic never picks anything up** — almost certainly the
  `MIC_DEVICE_INDEX = 1` issue above; fix it for this machine.
- **SAHAY randomly "wakes up" during normal conversation nearby** — `backend/main.py`
  currently treats the bare substring `"ai"` as a wake word, which matches inside common
  words like "rain" or "email". Remove `"ai"` from the `strip_wake()` phrase list.
- **SAHAY's Ollama answers never arrive** — confirm `ollama serve` is actually running
  (`http://localhost:11434` should respond) and `OLLAMA_ORIGINS` is set (step 3.3 above).
- **Blank/white dashboard after login** — open DevTools console (F12) and check for a red
  error; if it mentions "Cannot access '...' before initialization," it's a code-ordering
  bug in whatever file was last changed, not a data/config issue.
