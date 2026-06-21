package com.example.demo.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.util.StringUtils;

@Configuration
public class OAuth2ClientRegistrationConfig {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${oauth.google.client-id:}") String googleClientId,
            @Value("${oauth.google.client-secret:}") String googleClientSecret,
            @Value("${oauth.github.client-id:}") String githubClientId,
            @Value("${oauth.github.client-secret:}") String githubClientSecret) {

        List<ClientRegistration> registrations = new ArrayList<>();

        if (StringUtils.hasText(googleClientId) && StringUtils.hasText(googleClientSecret)) {
            registrations.add(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId(googleClientId)
                    .clientSecret(googleClientSecret)
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        }

        if (StringUtils.hasText(githubClientId) && StringUtils.hasText(githubClientSecret)) {
            registrations.add(CommonOAuth2Provider.GITHUB.getBuilder("github")
                    .clientId(githubClientId)
                    .clientSecret(githubClientSecret)
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .build());
        }

        if (registrations.isEmpty()) {
            return registrationId -> null;
        }

        return new InMemoryClientRegistrationRepository(registrations);
    }
}
