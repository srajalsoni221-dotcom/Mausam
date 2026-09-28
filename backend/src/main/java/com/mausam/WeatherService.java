package com.mausam.backend.service;

import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class WeatherService {

    private final RestClient restClient;
    private final JsonParser jsonParser;

    public WeatherService() {
        this.restClient = RestClient.create();
        this.jsonParser = JsonParserFactory.getJsonParser();
    }

    public Map<String, Object> getWeather(double latitude, double longitude) {

        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("api.open-meteo.com")
                        .path("/v1/forecast")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam(
                                "current",
                                "temperature_2m,relative_humidity_2m,wind_speed_10m"
                        )
                        .queryParam("timezone", "auto")
                        .build())
                .retrieve()
                .body(String.class);

        Map<String, Object> root = jsonParser.parseMap(response);

        @SuppressWarnings("unchecked")
        Map<String, Object> current =
                (Map<String, Object>) root.get("current");

        return Map.of(
                "latitude", latitude,
                "longitude", longitude,
                "temperatureC", current.get("temperature_2m"),
                "humidityPercent", current.get("relative_humidity_2m"),
                "windSpeedKmh", current.get("wind_speed_10m"),
                "time", current.get("time")
        );
    }
}