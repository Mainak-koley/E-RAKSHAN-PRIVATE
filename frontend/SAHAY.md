# SAHAY integration

SAHAY is a browser-first, safety-bounded assistant integrated into the E-Rakshan frontend. It preserves the existing dashboard UI and mounts as a small floating button in the lower-right corner.

## What works in the demo

- Click-to-speak voice input through the browser Web Speech API.
- Optional **"Hey Sahay"** wake-word mode after the officer enables microphone access.
- Browser text-to-speech replies and optional critical-alert read-out.
- Typed commands, route/page navigation, blocked-road map view, and a critical-habitations filter.
- Live priority rescue queue sourced from the existing risk engine.
- Briefings, explainable priority answers, shelter capacity answers, relocation suggestions, report navigation, and recommendation approval logging.
- Drag-and-drop assistant location saved in browser storage.
- State animation: idle, listening, analysing, and speaking.

## Safe boundary

SAHAY only analyses, recommends, explains, and navigates. It does **not** deploy teams, issue evacuation orders, or change real-world emergency status. Recommendations require a clear officer action in the panel.

## Jarvis reference handling

The useful Jarvis patterns were adapted for the web: speech input, speech output, wake-word flow, assistant states, and command routing. Desktop-only actions such as opening unrelated apps, media keys, browser-tab control, camera control, and hard-coded API credentials were deliberately not copied into E-Rakshan.

## Running

```bash
npm install
npm run dev
```

For microphone and speech recognition, use a current Chrome or Edge browser and approve the microphone prompt. The assistant remains usable through typed commands when voice recognition is unavailable.

## Production note

The present project is a functional demo using the existing in-browser E-Rakshan data/risk engine. A production deployment should connect SAHAY to a protected backend AI gateway; never put an OpenAI, weather, or other private API key in frontend source files.

## Local Jarvis-style voice bridge

Sahay can use the same proven microphone/TTS pattern as the supplied Jarvis project through `backend/`. The Python bridge owns the microphone with `speech_recognition` + PyAudio and speaks replies with `pyttsx3`; the React UI communicates with it over a local WebSocket. Start `backend/start_sahay_voice.bat` before using the Sahay microphone button or the “Hey Sahay” wake mode.
