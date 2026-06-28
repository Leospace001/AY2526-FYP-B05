package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // 🟢 Intercept UserAlreadyExistsException and build a clean 409 Conflict layout
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("error", "Service Unavailable");
        errorBody.put("message", ex.getMessage());
        errorBody.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        return new ResponseEntity<>(errorBody, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("error", "Bad Request");
        errorBody.put("message", ex.getMessage());
        errorBody.put("status", HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(errorBody, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, Object>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("error", "Conflict");
        errorBody.put("message", ex.getMessage());
        errorBody.put("status", HttpStatus.CONFLICT.value()); // 409
        
        return new ResponseEntity<>(errorBody, HttpStatus.CONFLICT);
    }
}