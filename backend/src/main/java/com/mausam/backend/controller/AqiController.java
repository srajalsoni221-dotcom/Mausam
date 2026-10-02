package com.mausam.backend.controller;

import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.Map;

@RestController
public class AqiController {

    private final RestClient restClient;
    private final JsonParser jsonParser;

    public AqiController() {
        this.restClient = RestClient.create();
        this.jsonParser = JsonParserFactory.getJsonParser();
    }

    @GetMapping("/aqi")
    public Map<String, Object> getAqi(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("air-quality-api.open-meteo.com")
                        .path("/v1/air-quality")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("current", "us_aqi,pm2_5,pm10")
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
                "aqi", current.get("us_aqi"),
                "pm2_5", current.get("pm2_5"),
                "pm10", current.get("pm10"),
                "time", current.get("time")
        );
    }
}