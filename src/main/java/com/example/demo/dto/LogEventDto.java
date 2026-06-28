package com.example.demo.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LogEventDto {
    private Long id;
    private String username;
    private String path;
    private String httpMethod;
    private LocalDateTime actionAt;
    private Long durationMs;
}
