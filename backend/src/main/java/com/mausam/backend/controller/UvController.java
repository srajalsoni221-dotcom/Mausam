package com.mausam.backend.controller;

import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.Map;

@RestController
public class UvController {

    private final RestClient restClient;
    private final JsonParser jsonParser;

    public UvController() {
        this.restClient = RestClient.create();
        this.jsonParser = JsonParserFactory.getJsonParser();
    }

    @GetMapping("/uv")
    public Map<String, Object> getUv(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("api.open-meteo.com")
                        .path("/v1/forecast")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("current", "uv_index")
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
                "uvIndex", current.get("uv_index"),
                "time", current.get("time")
        );
    }
}