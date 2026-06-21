package com.example.demo.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    @Value("${DOMAIN}")
    private String domainUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException {
        String redirectBase = domainUrl.endsWith("/") ? domainUrl.substring(0, domainUrl.length() - 1) : domainUrl;
        String message = URLEncoder.encode(
                exception.getMessage() != null ? exception.getMessage() : "OAuth sign-in was cancelled or failed.",
                StandardCharsets.UTF_8);
        response.sendRedirect(redirectBase + "/oauth/callback#error=" + message);
    }
}
