package com.mausam.backend.weather;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    private final RestClient restClient = RestClient.create();

    public WeatherResponse getWeather(double latitude, double longitude) {

        String url = "https://api.open-meteo.com/v1/forecast"
                + "?latitude=" + latitude
                + "&longitude=" + longitude
                + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code"
                + "&timezone=auto"
                + "&daily=precipitation_sum";

        Map<String, Object> response = restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);

        Map<String, Object> current =
                (Map<String, Object>) response.get("current");

        Map<String, Object> daily =
                (Map<String, Object>) response.get("daily");

        List<?> precipitationList =
                (List<?>) daily.get("precipitation_sum");

        double dailyPrecipitation =
                ((Number) precipitationList.get(0)).doubleValue();

        return new WeatherResponse(
        ((Number) current.get("temperature_2m")).doubleValue(),
        ((Number) current.get("apparent_temperature")).doubleValue(),
        ((Number) current.get("relative_humidity_2m")).intValue(),
        ((Number) current.get("wind_speed_10m")).doubleValue(),
        ((Number) current.get("precipitation")).doubleValue(),
        dailyPrecipitation,
        ((Number) current.get("weather_code")).intValue()
);
    }
    public ForecastResponse getForecast(double latitude, double longitude) {

    String url = "https://api.open-meteo.com/v1/forecast"
            + "?latitude=" + latitude
            + "&longitude=" + longitude
            + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
            + "&timezone=auto";

    Map<String, Object> response = restClient.get()
            .uri(url)
            .retrieve()
            .body(Map.class);

    Map<String, Object> daily =
            (Map<String, Object>) response.get("daily");

    return new ForecastResponse(
            (List<String>) daily.get("time"),
            (List<Double>) daily.get("temperature_2m_max"),
            (List<Double>) daily.get("temperature_2m_min"),
            (List<Double>) daily.get("precipitation_sum")
    );
}
}