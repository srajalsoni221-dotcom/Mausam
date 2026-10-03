package com.mausam.backend.user;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "user_preferences")
public class UserPreferences {

    @Id
    private String id;

    private String userId;
    private String language;
    private List<String> savedLocations;

    public UserPreferences() {
    }

    public UserPreferences(String userId, String language, List<String> savedLocations) {
        this.userId = userId;
        this.language = language;
        this.savedLocations = savedLocations;
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getLanguage() {
        return language;
    }

    public List<String> getSavedLocations() {
        return savedLocations;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public void setSavedLocations(List<String> savedLocations) {
        this.savedLocations = savedLocations;
    }
}