package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.GeminiChatRequest;
import com.example.demo.dto.GeminiChatResponse;
import com.example.demo.dto.GeminiStatusResponse;
import com.example.demo.exception.GeminiApiException;
import com.example.demo.service.GeminiService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/chat")
@SecurityRequirement(name = "bearerAuth")
public class GeminiChatController {

    @Autowired
    private GeminiService geminiService;

    @GetMapping("/gemini/status")
    @Operation(summary = "Test whether this server can reach Gemini (diagnostic)")
    public ResponseEntity<GeminiStatusResponse> status() {
        return ResponseEntity.ok(geminiService.checkStatus());
    }

    @PostMapping("/gemini")
    @Operation(summary = "Send a prompt to Gemini via the backend proxy")
    public ResponseEntity<?> chat(@RequestBody GeminiChatRequest request) {
        try {
            String text = geminiService.generateContent(request.getMessage());
            return ResponseEntity.ok(new GeminiChatResponse(text));
        } catch (GeminiApiException ex) {
            Map<String, Object> body = new HashMap<>();
            body.put("error", "Gemini Error");
            body.put("message", ex.getMessage());
            body.put("upstreamStatus", ex.getStatusCode());
            return ResponseEntity.status(mapToHttpStatus(ex.getStatusCode())).body(body);
        }
    }

    private HttpStatus mapToHttpStatus(int upstreamStatus) {
        if (upstreamStatus == 400) {
            return HttpStatus.BAD_REQUEST;
        }
        if (upstreamStatus == 429) {
            return HttpStatus.TOO_MANY_REQUESTS;
        }
        return HttpStatus.BAD_GATEWAY;
    }
}
