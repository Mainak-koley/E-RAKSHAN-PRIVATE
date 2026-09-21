import pyttsx3
import threading
import time

_speech_lock = threading.Lock()


def speak(text):
    if not text:
        return

    with _speech_lock:
        print("SAI:", text)

        engine = pyttsx3.init()

        voices = engine.getProperty("voices")
        if voices:
            engine.setProperty("voice", voices[0].id)

        engine.setProperty("rate", 165)

        try:
            engine.say(text)
            engine.runAndWait()
        finally:
            engine.stop()

        time.sleep(0.1)