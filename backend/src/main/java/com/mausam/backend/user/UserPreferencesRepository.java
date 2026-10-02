package com.mausam.backend.user;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserPreferencesRepository
        extends MongoRepository<UserPreferences, String> {

    Optional<UserPreferences> findByUserId(String userId);
}