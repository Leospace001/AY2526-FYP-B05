package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.example.demo.dto.GeminiChatRequest;
import com.example.demo.service.GeminiService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/chat")
@SecurityRequirement(name = "bearerAuth")
public class GeminiChatController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping(value = "/gemini", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream a Gemini chat response via the backend proxy")
    public SseEmitter chat(@RequestBody GeminiChatRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);
        geminiService.streamChat(request.getMessage(), emitter);
        return emitter;
    }
}
