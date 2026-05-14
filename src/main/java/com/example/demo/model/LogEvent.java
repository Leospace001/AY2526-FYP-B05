package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_events")
@Getter
@Setter
public class LogEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = false)
    private String username;

    @Column(nullable = false, unique = false)
    private String path;

    @Column(nullable = false, unique = false)
    private String httpMethod;

    @Column(nullable = false, unique = false)
    private LocalDateTime loggedInAt;

    @Column(nullable = true, unique = false)
    private long duration;

    @Builder
    public LogEvent(
        String username,
        String path,
        String httpMethod,
        LocalDateTime loggedInAt,
        long duration
    ) {
        this.username = username;
        this.path = path;
        this.httpMethod = httpMethod;
        this.loggedInAt = loggedInAt;
        this.duration = duration;
    }

}