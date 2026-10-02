package com.mausam.backend.controller;

import com.mausam.backend.weather.ForecastResponse;
import com.mausam.backend.weather.ForecastService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ForecastController {

    private final ForecastService forecastService;

    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @GetMapping("/forecast")
    public ForecastResponse getForecast(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        return forecastService.getForecast(latitude, longitude);
    }
}