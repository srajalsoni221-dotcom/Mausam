package com.mausam.backend.dashboard;

import com.mausam.backend.recommendation.AqiService;
import com.mausam.backend.recommendation.RecommendationService;
import com.mausam.backend.recommendation.UvService;
import com.mausam.backend.user.UserPreferences;
import com.mausam.backend.user.UserPreferencesService;
import com.mausam.backend.weather.WeatherResponse;
import com.mausam.backend.weather.WeatherService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardService {

    private final WeatherService weatherService;
    private final AqiService aqiService;
    private final UvService uvService;
    private final RecommendationService recommendationService;
    private final UserPreferencesService userPreferencesService;

    public DashboardService(
            WeatherService weatherService,
            AqiService aqiService,
            UvService uvService,
            RecommendationService recommendationService,
            UserPreferencesService userPreferencesService) {

        this.weatherService = weatherService;
        this.aqiService = aqiService;
        this.uvService = uvService;
        this.recommendationService = recommendationService;
        this.userPreferencesService = userPreferencesService;
    }

    public DashboardResponse getDashboard(
            String userId,
            double latitude,
            double longitude) {

        WeatherResponse weather =
                weatherService.getWeather(latitude, longitude);

        int aqi =
                aqiService.getAqi(latitude, longitude);

        double uvIndex =
                uvService.getUvIndex(latitude, longitude);

        String recommendation =
                recommendationService.getRecommendation(
                        latitude,
                        longitude);

        UserPreferences preferences =
                userPreferencesService.getPreferences(userId);

        List<String> savedLocations =
                preferences != null
                        ? preferences.getSavedLocations()
                        : List.of();

        return new DashboardResponse(
                weather,
                aqi,
                uvIndex,
                recommendation,
                savedLocations
        );
    }
}