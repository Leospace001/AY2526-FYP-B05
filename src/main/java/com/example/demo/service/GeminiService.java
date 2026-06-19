package com.example.demo.service;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import com.example.demo.dto.GeminiStatusResponse;
import com.example.demo.exception.GeminiApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GeminiService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${app.gemini.proxy-host:}")
    private String proxyHost;

    @Value("${app.gemini.proxy-port:0}")
    private int proxyPort;

    @PostConstruct
    void applyProxySystemProperties() {
        if (proxyHost != null && !proxyHost.isBlank() && proxyPort > 0) {
            System.setProperty("https.proxyHost", proxyHost);
            System.setProperty("https.proxyPort", String.valueOf(proxyPort));
            System.setProperty("http.proxyHost", proxyHost);
            System.setProperty("http.proxyPort", String.valueOf(proxyPort));
        }
    }

    public GeminiStatusResponse checkStatus() {
        boolean keyConfigured = apiKey != null && !apiKey.isBlank();
        boolean proxyConfigured = proxyHost != null && !proxyHost.isBlank() && proxyPort > 0;

        if (!keyConfigured) {
            return new GeminiStatusResponse(
                    false, model, proxyConfigured, proxyHost, proxyPort,
                    false, 503, "GEMINI_API_KEY is not set on the server.");
        }

        try {
            generateContent("Reply with exactly: ok");
            return new GeminiStatusResponse(
                    true, model, proxyConfigured, proxyHost, proxyPort,
                    true, 200, "Gemini is reachable from this server.");
        } catch (GeminiApiException ex) {
            return new GeminiStatusResponse(
                    true, model, proxyConfigured, proxyHost, proxyPort,
                    false, ex.getStatusCode(), ex.getMessage());
        }
    }

    public String generateContent(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new GeminiApiException(503, "Gemini API key is not configured on the server (GEMINI_API_KEY).");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new GeminiApiException(400, "Message must not be empty.");
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt))))));

            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    model, apiKey);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(90))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = buildHttpClient().send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() >= 400) {
                throw new GeminiApiException(
                        response.statusCode(),
                        formatUpstreamError(response.statusCode(), response.body()));
            }

            return extractText(objectMapper.readTree(response.body()));
        } catch (GeminiApiException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new GeminiApiException(502, "Could not reach Gemini: " + ex.getMessage());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new GeminiApiException(502, "Gemini request was interrupted.");
        }
    }

    private HttpClient buildHttpClient() {
        HttpClient.Builder builder = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20));

        if (proxyHost != null && !proxyHost.isBlank() && proxyPort > 0) {
            builder.proxy(ProxySelector.of(new InetSocketAddress(proxyHost, proxyPort)));
        } else {
            builder.proxy(ProxySelector.getDefault());
        }

        return builder.build();
    }

    private String extractText(JsonNode root) {
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (parts.isArray() && !parts.isEmpty()) {
            String text = parts.get(0).path("text").asText("");
            if (!text.isBlank()) {
                return text;
            }
        }
        throw new GeminiApiException(502, "Gemini returned an empty response.");
    }

    private String formatUpstreamError(int statusCode, String errorBody) {
        String googleMessage = summarizeError(errorBody);
        if (statusCode == 403) {
            return "Gemini blocked this request (403). Your server's region/IP may not be supported. "
                    + "Use an EC2 region such as us-east-1, or set GEMINI_PROXY_HOST/GEMINI_PROXY_PORT on the server. "
                    + "Details: " + googleMessage;
        }
        if (statusCode == 429) {
            if (googleMessage.contains("limit: 0") || googleMessage.contains("free_tier")) {
                return "Gemini quota exhausted or model unavailable on free tier (429). "
                        + "Model '" + model + "' may be deprecated or out of quota — try GEMINI_MODEL=gemini-2.5-flash "
                        + "or enable billing at https://ai.google.dev. Details: " + googleMessage;
            }
            return "Gemini rate limit reached (429). Wait a minute and retry. Details: " + googleMessage;
        }
        return "Gemini API error (" + statusCode + "): " + googleMessage;
    }

    private String summarizeError(String errorBody) {
        try {
            JsonNode root = objectMapper.readTree(errorBody);
            JsonNode message = root.path("error").path("message");
            if (!message.isMissingNode()) {
                return message.asText();
            }
        } catch (Exception ignored) {
            // fall through
        }
        return errorBody.length() > 200 ? errorBody.substring(0, 200) + "..." : errorBody;
    }
}
