package com.mausam.backend.weather;

import java.util.List;

public record ForecastResponse(
        List<String> dates,
        List<Double> maxTemperatures,
        List<Double> minTemperatures,
        List<Double> precipitation
) {
}