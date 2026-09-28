from fastapi import FastAPI
from weather_client import get_weather
from pydantic import BaseModel

app = FastAPI(title="Mausam AI Service")


class ChatRequest(BaseModel):
    message: str
    language: str = "english"
    latitude: float
    longitude: float


class ChatResponse(BaseModel):
    reply: str
    intent: str

def detect_intent(message: str) -> str:
    message = message.lower()

    if any(word in message for word in [
        "run", "running", "jog", "jogging",
        " दौड़", "daud"
    ]):
        return "RUNNING"

    if any(word in message for word in [
        "travel", "trip", "journey", "traveling",
        "safar", "ghumna", "ghumne"
    ]):
        return "TRAVEL"

    if any(word in message for word in [
        "temperature", "temp", "hot", "cold",
        "garmi", "thand"
    ]):
        return "TEMPERATURE"

    if any(word in message for word in [
        "humidity", "humid", "moisture", "nami"
    ]):
        return "HUMIDITY"

    if any(word in message for word in [
        "wind", "windy", "hawa"
    ]):
        return "WIND"

    if any(word in message for word in [
        "outdoor", "outside", "bahar", "outdoor activity"
    ]):
        return "OUTDOOR_ACTIVITY"

    if any(word in message for word in [
        "heat alert", "heat warning", "heatwave",
        "loo", "bahut garmi"
    ]):
        return "HEAT_ALERT"

    if any(word in message for word in [
        "weather", "mausam", "forecast"
    ]):
        return "GENERAL_WEATHER"

    return "GENERAL_WEATHER"

def generate_ai_response(message: str, weather_context: dict, language: str) -> str:
    from google import genai
    import os
    import time

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    prompt = f"""
You are Mausam, an AI weather assistant for India.

Answer the user's question naturally and conversationally.

You have access to the following current weather data:

Temperature: {weather_context["temperature"]}°C
Feels like: {weather_context["feels_like"]}°C
Humidity: {weather_context["humidity"]}%
Wind speed: {weather_context["wind_speed"]} km/h
Precipitation: {weather_context["precipitation"]} mm
Today's forecast precipitation: {weather_context["daily_precipitation"]} mm

User language preference: {language}

Language instructions:
- If language is "english", answer in natural English.
- If language is "hindi", answer in natural Hindi using Devanagari script.
- If language is "hinglish", answer in natural Hinglish using Roman Hindi mixed with simple English.
- Keep the same language/style throughout the answer.
- Do not switch to another language unless the user asks for it.

User question:
{message}

Important rules:
- Use the weather data above when relevant.
- Do not invent weather values that are not provided.
- If the user asks for advice such as running, commuting, outdoor activities, heat precautions, etc., give a practical answer based on the available weather data.
- If the question cannot be answered from the available weather data, clearly say what information is missing.
- Only use weather information that is explicitly provided in the weather context.
- Never assume or claim that it is raining, not raining, sunny, cloudy, or that there are no severe weather conditions unless that information is provided.
- If the user asks about information that is not available in the weather context, clearly say that the information is currently unavailable.
- Keep the answer concise and natural.
- Treat precipitation values as forecast information, not a guarantee.
- If today's forecast precipitation is 0 mm, say that no significant rainfall is currently forecast based on the available data.
- Do not say that rain is impossible or guaranteed not to happen.
- If today's forecast precipitation is greater than 0 mm, explain that rainfall is forecast/possible based on the available data.
- When giving umbrella or outdoor advice, make it clear that the advice is based only on the available weather data.
- Do not guarantee that an outdoor activity is completely safe or unsafe.
- For activity advice, describe the relevant weather conditions and practical precautions, then let the user make the final decision.
"""
    import time

    try:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=prompt
                )

                return response.text

            except Exception as e:
                print(f"GEMINI ERROR (attempt {attempt + 1}/3):", repr(e))

                if attempt < 2:
                    time.sleep(2)

        return (
            "Mausam AI is temporarily busy. "
            "Please try again in a few seconds."
        )

    except Exception as e:
        print("AI SERVICE ERROR:", repr(e))
        return (
            "Mausam AI is temporarily unavailable. "
            "Please try again in a moment."
        )


@app.get("/")
def root():
    return {
        "message": "Mausam AI Service is running!"
    }


@app.post("/api/v1/ai/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    weather = get_weather(
        request.latitude,
        request.longitude
    )
    weather_context = {
    "temperature": weather["temperature"],
    "feels_like": weather["feelsLike"],
    "humidity": weather["humidity"],
    "wind_speed": weather["windSpeed"],
    "precipitation": weather["precipitation"],
    "daily_precipitation": weather["dailyPrecipitation"]
    }

    intent = detect_intent(request.message)

    
    if intent == "TEMPERATURE":
        reply = (
        f"Current temperature is {weather_context['temperature']}°C "
        f"and it feels like {weather_context['feels_like']}°C."
    )

    elif intent == "HUMIDITY":
        reply = (
        f"Current humidity is {weather_context['humidity']}%."
    )

    elif intent == "WIND":
        reply = (
        f"Current wind speed is {weather_context['wind_speed']} km/h."
    )

    else:
        reply = (
        f"Current temperature is {weather_context['temperature']}°C, "
        f"feels like {weather_context['feels_like']}°C, "
        f"humidity is {weather_context['humidity']}%, "
        f"and wind speed is {weather_context['wind_speed']} km/h."
    )
        
    reply = generate_ai_response(
    request.message,
    weather_context,
    request.language
    )
        
    return ChatResponse(
    reply=reply,
    intent=intent
    )

