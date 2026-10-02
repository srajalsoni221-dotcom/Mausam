package com.mausam.backend.recommendation;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/recommendation")
    public String getRecommendation(
            @RequestParam double temperature,
            @RequestParam int aqi,
            @RequestParam double uvIndex) {

        return recommendationService.getRecommendation(
                temperature,
                aqi,
                uvIndex
        );
    }
}