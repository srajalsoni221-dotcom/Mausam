package com.mausam.backend.dashboard;

import com.mausam.backend.weather.WeatherResponse;

import java.util.List;

public record DashboardResponse(
        WeatherResponse weather,
        int aqi,
        double uvIndex,
        String recommendation,
        List<String> savedLocations
) {
}