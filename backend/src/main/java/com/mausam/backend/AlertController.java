package com.mausam.backend.alert;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AlertController {

    @GetMapping("/alert")
    public String getAlert() {
        return "Weather alert service is working!";
    }
}