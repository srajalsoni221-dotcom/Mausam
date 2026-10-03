package com.mausam.backend.controller;

import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.Map;

@RestController
public class SunMoonController {

    private final RestClient restClient;
    private final JsonParser jsonParser;

    public SunMoonController() {
        this.restClient = RestClient.create();
        this.jsonParser = JsonParserFactory.getJsonParser();
    }

    @GetMapping("/sun-moon")
    public Map<String, Object> getSunMoon(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("api.open-meteo.com")
                        .path("/v1/forecast")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("daily", "sunrise,sunset")
                        .queryParam("timezone", "auto")
                        .build())
                .retrieve()
                .body(String.class);

        Map<String, Object> root = jsonParser.parseMap(response);

        @SuppressWarnings("unchecked")
        Map<String, Object> daily =
                (Map<String, Object>) root.get("daily");

        return Map.of(
                "latitude", latitude,
                "longitude", longitude,
                "sunrise", ((java.util.List<?>) daily.get("sunrise")).get(0),
                "sunset", ((java.util.List<?>) daily.get("sunset")).get(0)
        );
    }
}