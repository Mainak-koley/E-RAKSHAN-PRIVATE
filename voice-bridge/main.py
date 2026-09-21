import asyncio
import threading
import time
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from voice.input import listen
from voice.output import speak


app = FastAPI(title="E-Rakshan Sahay Voice Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


clients: set[WebSocket] = set()
clients_lock = threading.Lock()
loop: Optional[asyncio.AbstractEventLoop] = None

state_lock = threading.Lock()
wake_enabled = False
armed = False
manual_listen = False
speaking_now = False
running = True


def snapshot():
    with state_lock:
        return {
            "wake_enabled": wake_enabled,
            "armed": armed,
            "manual_listen": manual_listen,
            "speaking": speaking_now,
        }


def schedule_broadcast(payload: dict):
    if loop is None:
        return

    asyncio.run_coroutine_threadsafe(
        broadcast(payload),
        loop
    )


async def broadcast(payload: dict):
    dead = []

    with clients_lock:
        current = list(clients)

    for ws in current:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)

    if dead:
        with clients_lock:
            for ws in dead:
                clients.discard(ws)


def strip_wake(text: str) -> tuple[bool, str]:
    lower = text.lower().strip()

    wake_phrases = (
        "hello sahay",
        "yo sahay",
        "hey sahay",
        "hi sahay",
        "sahay",
        "hello sai",
        "yo sai",
        "hey sai",
        "hi sai",
        "sai",
    )

    for phrase in wake_phrases:
        if lower.startswith(phrase):
            command = lower[len(phrase):].strip(" ,.!?")
            return True, command

    return False, ""


def speak_async(text: str):
    global speaking_now

    with state_lock:
        speaking_now = True

    schedule_broadcast({
        "type": "status",
        "state": "speaking"
    })

    try:
        speak(text)

    finally:
        with state_lock:
            speaking_now = False

        schedule_broadcast({
            "type": "status",
            "state": "idle"
        })


def voice_loop():
    global armed, manual_listen

    schedule_broadcast({
        "type": "status",
        "state": "listening"
    })

    while running:

        with state_lock:
            if speaking_now:
                time.sleep(0.15)
                continue

            enabled = wake_enabled
            one_shot = manual_listen

        if not enabled and not one_shot:
            time.sleep(0.15)
            continue

        try:
            text = listen()

        except Exception as exc:
            schedule_broadcast({
                "type": "error",
                "message": (
                    f"SAI could not access the microphone: {exc}. "
                    "Check the microphone/PyAudio setup."
                ),
            })

            with state_lock:
                manual_listen = False

            time.sleep(2.0)
            continue

        if not text:
            continue

        text = text.strip().lower()

        with state_lock:
            enabled = wake_enabled
            one_shot = manual_listen

        if enabled:
            detected, command = strip_wake(text)

            if detected:
                with state_lock:
                    armed = True

                schedule_broadcast({
                    "type": "wake",
                    "text": text,
                    "command": command,
                })

                if command:
                    time.sleep(0.8)

                    with state_lock:
                        armed = False

                    schedule_broadcast({
                        "type": "transcript",
                        "text": command,
                    })

                continue

            if armed:
                with state_lock:
                    armed = False

                schedule_broadcast({
                    "type": "transcript",
                    "text": text,
                })

            continue

        if one_shot:
            with state_lock:
                manual_listen = False

            schedule_broadcast({
                "type": "transcript",
                "text": text,
            })


@app.on_event("startup")
async def startup_event():
    global loop

    loop = asyncio.get_running_loop()

    threading.Thread(
        target=voice_loop,
        daemon=True,
        name="sai-voice-bridge"
    ).start()


@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": "sahay-voice-bridge",
        **snapshot(),
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    with clients_lock:
        clients.add(websocket)

    await websocket.send_json({
        "type": "ready",
        **snapshot(),
    })

    try:
        while True:
            message = await websocket.receive_json()
            kind = message.get("type")

            if kind == "set_wake":
                global wake_enabled, armed

                with state_lock:
                    wake_enabled = bool(message.get("enabled"))
                    armed = False

                await websocket.send_json({
                    "type": "wake_state",
                    "enabled": wake_enabled,
                })

            elif kind == "listen":
                global manual_listen

                with state_lock:
                    manual_listen = True
                    armed = False

                await websocket.send_json({
                    "type": "status",
                    "state": "listening",
                })

            elif kind == "speak":
                text = str(
                    message.get("text", "")
                ).strip()

                if text:
                    threading.Thread(
                        target=speak_async,
                        args=(text,),
                        daemon=True,
                    ).start()

            elif kind == "stop":
                with state_lock:
                    manual_listen = False
                    armed = False

    except WebSocketDisconnect:
        pass

    finally:
        with clients_lock:
            clients.discard(websocket)