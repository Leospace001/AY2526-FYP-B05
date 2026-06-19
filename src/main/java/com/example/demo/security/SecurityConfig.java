package com.example.demo.security;

import com.example.demo.service.CustomUserDetailsService;
import com.example.demo.service.LogEventService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.web.cors.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.*;

@SuppressWarnings("deprecation")
@EnableGlobalMethodSecurity(securedEnabled = true, prePostEnabled = true)
@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final LogEventService logEventService;
    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    public SecurityConfig(CustomUserDetailsService userDetailsService, JwtUtil jwtUtil,
                          LogEventService logEventService) {
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.logEventService = logEventService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public JwtRequestFilter jwtRequestFilter() {
        return new JwtRequestFilter(userDetailsService, jwtUtil, logEventService);
    }

    @Bean
    public JsonUsernamePasswordAuthenticationFilter jsonUsernamePasswordAuthenticationFilter(
            AuthenticationManager authManager) {
        return new JsonUsernamePasswordAuthenticationFilter(authManager, jwtUtil);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   AuthenticationManager authManager,
                                                   JsonUsernamePasswordAuthenticationFilter jsonFilter,
                                                   JwtRequestFilter jwtRequestFilter) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                            "/",
                            "/v3/api-docs/**",
                            "/swagger-ui/**",
                            "/swagger.yaml",
                            "/api/emails/**"
                        ).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/register", "/api/login", "/api/reset-password", "/api/forgot-password").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jsonFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtRequestFilter, AuthorizationFilter.class)
                .exceptionHandling(exception -> exception
                    .authenticationEntryPoint((request, response, authException) -> {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Access token missing or expired.\"}");
                    })
                )
                .build();
    }

    public static class JsonUsernamePasswordAuthenticationFilter extends UsernamePasswordAuthenticationFilter {
        private final ObjectMapper objectMapper = new ObjectMapper();
        private final JwtUtil jwtUtil;

        public JsonUsernamePasswordAuthenticationFilter(AuthenticationManager authManager, JwtUtil jwtUtil) {
            super.setAuthenticationManager(authManager);
            this.jwtUtil = jwtUtil;
            setFilterProcessesUrl("/api/login");
        }

        @Override
        protected boolean requiresAuthentication(HttpServletRequest request, HttpServletResponse response) {
            return "/api/login".equals(request.getServletPath())
                    && "POST".equalsIgnoreCase(request.getMethod());
        }

        @SuppressWarnings("unchecked")
        @Override
        public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
                throws AuthenticationException {
            if ("application/json".equals(request.getContentType())) {
                try {
                    Map<String, String> authRequest = objectMapper.readValue(request.getInputStream(), Map.class);
                    String username = authRequest.get("username");
                    String password = authRequest.get("password");
                    UsernamePasswordAuthenticationToken token =
                            new UsernamePasswordAuthenticationToken(username, password);
                    setDetails(request, token);
                    return this.getAuthenticationManager().authenticate(token);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
            return super.attemptAuthentication(request, response);
        }

        @Override
        protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                                FilterChain chain, Authentication authResult)
                throws IOException {
            CustomUserDetails userPrincipal = (CustomUserDetails) authResult.getPrincipal();
            String username = userPrincipal.getUsername();
            String token = jwtUtil.generateToken(authResult);
            userActivityLogger.info("{} logged in successfully: ", username);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            String json = String.format("{ \"token\": \"%s\"}", token);
            response.getWriter().write(json);
        }

        @Override
        protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
                                                  AuthenticationException failed) throws IOException {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Invalid username or password\"}");
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://frontend",
            "http://ui:5173",
            "http://localhost*",
            "https://leospace.cc",
            "https://www.leospace.cc",
            "http://leospace.cc",
            "http://www.leospace.cc"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
