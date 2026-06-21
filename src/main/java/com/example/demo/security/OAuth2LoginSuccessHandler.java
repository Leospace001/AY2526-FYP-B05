package com.example.demo.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.example.demo.service.OAuthUserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    private final OAuthUserService oauthUserService;
    private final JwtUtil jwtUtil;

    @Value("${DOMAIN}")
    private String domainUrl;

    public OAuth2LoginSuccessHandler(OAuthUserService oauthUserService, JwtUtil jwtUtil) {
        this.oauthUserService = oauthUserService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId();

        try {
            CustomUserDetails userDetails = oauthUserService.resolveOAuthLogin(provider, oauth2User);
            Authentication jwtAuth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            String token = jwtUtil.generateToken(jwtAuth);

            userActivityLogger.info("OAuth login successful for {} via {}", userDetails.getUsername(), provider);

            String redirectBase = domainUrl.endsWith("/") ? domainUrl.substring(0, domainUrl.length() - 1) : domainUrl;
            String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
            response.sendRedirect(redirectBase + "/oauth/callback#token=" + encodedToken);
        } catch (Exception ex) {
            userActivityLogger.error("OAuth login failed for provider {}", provider, ex);
            String redirectBase = domainUrl.endsWith("/") ? domainUrl.substring(0, domainUrl.length() - 1) : domainUrl;
            String detail = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            String message = URLEncoder.encode("OAuth sign-in failed: " + detail, StandardCharsets.UTF_8);
            response.sendRedirect(redirectBase + "/oauth/callback#error=" + message);
        }
    }
}
