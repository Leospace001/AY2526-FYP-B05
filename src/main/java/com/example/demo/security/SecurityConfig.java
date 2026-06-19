package com.example.demo.security;

import com.example.demo.service.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.security.web.*;
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
    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    public SecurityConfig(CustomUserDetailsService userDetailsService, JwtUtil jwtUtil) {
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
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
    public JsonUsernamePasswordAuthenticationFilter jsonUsernamePasswordAuthenticationFilter(
            AuthenticationManager authManager) {
        return new JsonUsernamePasswordAuthenticationFilter(authManager, jwtUtil);
    }

    public static class JsonUsernamePasswordAuthenticationFilter extends UsernamePasswordAuthenticationFilter {
        private final ObjectMapper objectMapper = new ObjectMapper();
        private final JwtUtil jwtUtil;

        public JsonUsernamePasswordAuthenticationFilter(AuthenticationManager authManager, JwtUtil jwtUtil) {
            super.setAuthenticationManager(authManager);
            this.jwtUtil = jwtUtil;
            setFilterProcessesUrl("/api/login"); 
        }

        // 🟢 FIX: We intercept requests before attemptAuthentication can run.
        // If a request is going to /api/register, we jump out of this filter completely 
        // and send it down the standard Spring filter line.
        @Override
        public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                throws IOException, ServletException {
            HttpServletRequest request = (HttpServletRequest) req;
            
            if (!"/api/login".equals(request.getServletPath())) {
                chain.doFilter(req, res); // Skip this filter entirely
                return;
            }
            
            super.doFilter(req, res, chain);
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
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   AuthenticationManager authManager,
                                                   JsonUsernamePasswordAuthenticationFilter jsonFilter) throws Exception {
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
                .addFilterAfter(jwtRequestFilter, JsonUsernamePasswordAuthenticationFilter.class)
                
                .exceptionHandling(exception -> exception
                    .authenticationEntryPoint((request, response, authException) -> {
                        // This block now ONLY triggers if someone tries to visit secure endpoints 
                        // without an authorization token header.
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Access token missing or expired.\"}");
                    })
                )
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://frontend",
            "http://ui:5173",
            "http://localhost",
            "http://localhost:5173",
            "https://leospace.cc"
            ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}