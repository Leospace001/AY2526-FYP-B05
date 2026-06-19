package com.example.demo.exception;

public class GeminiApiException extends RuntimeException {

    private final int statusCode;

    public GeminiApiException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
