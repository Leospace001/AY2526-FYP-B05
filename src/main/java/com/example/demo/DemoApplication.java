package com.example.demo;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * This project is for AY2526 owned by Leo YUEN.
 * 
 * @author Leo YUEN 220240436@stu.vtc.edu.hk yuen7895123@yahoo.com.hk
 * @version 1.0
 * @since 2025-12-24
 * @see https://github.com/leospace001/
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
