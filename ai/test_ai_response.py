from main import generate_ai_response

weather_context = {
    "temperature": 29.6,
    "feels_like": 32.6,
    "humidity": 60,
    "wind_speed": 13.2,
    "precipitation": 0.0,
    "daily_precipitation": 0.0
}

reply = generate_ai_response(
    "It feels very hot. Is it okay to go for a run right now?",
    weather_context,
    "english"
)

print("\nAI Reply:")
print(reply)