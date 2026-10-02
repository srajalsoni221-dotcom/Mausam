package com.mausam.backend.recommendation;

import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    public String getRecommendation(
            double temperature,
            int aqi,
            double uvIndex) {

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