package com.mausam.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/")
    public String home() {
        return "Mausam Backend is running!";
    }

    @GetMapping("/db-test")
    public String databaseTest() {
        return "MongoDB connection is working!";
    }
}