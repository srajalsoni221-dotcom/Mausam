package com.mausam.backend.weather;

public record WeatherResponse(

        double temperature,

        double feelsLike,

        int humidity,

        double windSpeed,

        double precipitation,

        double dailyPrecipitation,

        int weatherCode

) {

}