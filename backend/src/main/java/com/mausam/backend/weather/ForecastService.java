package com.mausam.backend.weather;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class ForecastService {

    private final RestClient restClient = RestClient.create();

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