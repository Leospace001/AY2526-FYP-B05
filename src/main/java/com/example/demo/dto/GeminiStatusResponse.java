package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GeminiStatusResponse {
    private boolean apiKeyConfigured;
    private String model;
    private boolean proxyConfigured;
    private String proxyHost;
    private int proxyPort;
    private boolean reachable;
    private int upstreamStatus;
    private String message;
}
