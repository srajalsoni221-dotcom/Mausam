package com.mausam.backend.user;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user/preferences")
public class UserPreferencesController {

    private final UserPreferencesService service;

    public UserPreferencesController(UserPreferencesService service) {
        this.service = service;
    }

    @PostMapping
    public UserPreferences savePreferences(
            @RequestParam String userId,
            @RequestParam String language,
            @RequestParam List<String> savedLocations) {

        return service.savePreferences(
                userId,
                language,
                savedLocations
        );
    }

    @GetMapping
    public UserPreferences getPreferences(
            @RequestParam String userId) {

        return service.getPreferences(userId);
    }
}