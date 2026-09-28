import httpx


JAVA_BACKEND_URL = "http://localhost:8080"


def get_weather(latitude: float, longitude: float):
    url = f"{JAVA_BACKEND_URL}/api/v1/weather"

    response = httpx.get(
        url,
        params={
            "latitude": latitude,
            "longitude": longitude,
        },
        timeout=10.0,
    )

    response.raise_for_status()

    return response.json()

if __name__ == "__main__":
    weather = get_weather(22.75, 78.73)
    print(weather)