package com.example.demo.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeZoneConfig {

    @PostConstruct
    void configureTimeZone() {
        AppTimeZone.setJvmDefault();
    }
}
