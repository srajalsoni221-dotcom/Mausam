package com.mausam.backend.user;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserPreferencesService {

    private final UserPreferencesRepository repository;

    public UserPreferencesService(UserPreferencesRepository repository) {
        this.repository = repository;
    }

    public UserPreferences savePreferences(
            String userId,
            String language,
            List<String> savedLocations) {

        UserPreferences preferences =
                new UserPreferences(userId, language, savedLocations);

        return repository.save(preferences);
    }

    public UserPreferences getPreferences(String userId) {
        return repository.findByUserId(userId).orElse(null);
    }
}