package com.mausam.backend.recommendation;

import com.mausam.backend.weather.WeatherResponse;
import com.mausam.backend.weather.WeatherService;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private final WeatherService weatherService;
    private final AqiService aqiService;
    private final UvService uvService;

    public RecommendationService(
            WeatherService weatherService,
            AqiService aqiService,
            UvService uvService) {

        this.weatherService = weatherService;
        this.aqiService = aqiService;
        this.uvService = uvService;
    }

    public String getRecommendation(
            double latitude,
            double longitude) {

        WeatherResponse weather =
                weatherService.getWeather(latitude, longitude);

        int aqi =
                aqiService.getAqi(latitude, longitude);

        double uvIndex =
                uvService.getUvIndex(latitude, longitude);

        double temperature = weather.temperature();

        if (aqi > 150) {
            return "Air quality is poor. Avoid outdoor activities.";
        }

        if (uvIndex >= 8) {
            return "UV is very high. Avoid strong afternoon sunlight.";
        }

        if (temperature >= 35) {
            return "It is very hot. Stay hydrated and avoid heavy outdoor activity.";
        }

        if (temperature <= 15) {
            return "It is cold. Wear warm clothes before going outside.";
        }

        return "Weather conditions look comfortable today.";
    }
}