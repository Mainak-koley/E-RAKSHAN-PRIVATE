import speech_recognition as sr

MIC_DEVICE_INDEX = 1

recognizer = sr.Recognizer()

recognizer.energy_threshold = 300
recognizer.dynamic_energy_threshold = True
recognizer.dynamic_energy_adjustment_damping = 0.15
recognizer.dynamic_energy_ratio = 1.5

recognizer.pause_threshold = 2.0
recognizer.phrase_threshold = 0.2
recognizer.non_speaking_duration = 0.5


def listen():
    try:
        with sr.Microphone(device_index=MIC_DEVICE_INDEX) as source:
            print("Listening...")

            recognizer.adjust_for_ambient_noise(
                source,
                duration=0.5
            )

            print("Speak now...")

            try:
                audio = recognizer.listen(
                    source,
                    timeout=5,
                    phrase_time_limit=10
                )
            except sr.WaitTimeoutError:
                return ""

    except Exception as exc:
        print(f"Microphone error: {exc}")
        return ""

    try:
        command = recognizer.recognize_google(
            audio,
            language="en-IN"
        )

        print("You:", command)
        return command.lower().strip()

    except sr.UnknownValueError:
        print("Could not understand speech.")
        return ""

    except sr.RequestError as exc:
        print(f"Speech recognition API error: {exc}")
        return ""