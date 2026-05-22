package com.example.demo;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * This project is for AY2526 owned by Leo YUEN.
 * 
 * @author Leo YUEN
 * @version 1.0
 * @since 2025-12-24
 */

@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableRabbit
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
