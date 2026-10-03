package com.mausam.backend.recommendation;

import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AqiService {

    private final RestClient restClient = RestClient.create();
    private final JsonParser jsonParser = JsonParserFactory.getJsonParser();

    public int getAqi(double latitude, double longitude) {

        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("air-quality-api.open-meteo.com")
                        .path("/v1/air-quality")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("current", "us_aqi")
                        .queryParam("timezone", "auto")
                        .build())
                .retrieve()
                .body(String.class);

        Map<String, Object> root = jsonParser.parseMap(response);

        @SuppressWarnings("unchecked")
        Map<String, Object> current =
                (Map<String, Object>) root.get("current");

        return ((Number) current.get("us_aqi")).intValue();
    }
}