package com.mausam.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.Map;

@RestController
public class LocationController {

    private final RestClient restClient = RestClient.create();

    @GetMapping("/location")
    public Map<String, Object> getLocation(
            @RequestParam String city) {

        String url = "https://geocoding-api.open-meteo.com/v1/search"
                + "?name=" + city
                + "&count=5"
                + "&language=en"
                + "&format=json";

        return restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);
    }
}