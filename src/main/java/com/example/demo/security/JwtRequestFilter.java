package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.example.demo.service.CustomUserDetailsService;
import com.example.demo.service.LogEventService;
import com.example.demo.model.LogEvent;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.time.Instant;
import java.io.IOException;

public class JwtRequestFilter extends OncePerRequestFilter {

    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final LogEventService logEventService;
    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    public JwtRequestFilter(CustomUserDetailsService userDetailsService, JwtUtil jwtUtil,
                            LogEventService logEventService) {
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.logEventService = logEventService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();
        LocalDateTime currentTime = LocalDateTime.now();
        long startTime = System.currentTimeMillis();
        String method = request.getMethod();

        if ("/api/login".equals(path) || "/api/register".equals(path)
                || "/api/auth/oauth/providers".equals(path)
                || path.startsWith("/api/forgot-password") || path.startsWith("/api/reset-password")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/oauth2/") || path.startsWith("/login/oauth2/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7).trim();
            if (!jwt.isEmpty()) {
                try {
                    String username = jwtUtil.extractUsername(jwt);
                    if (username != null) {
                        UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                        if (jwtUtil.validateToken(jwt, userDetails)) {
                            UsernamePasswordAuthenticationToken authToken =
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);

                            try {
                                long duration = System.currentTimeMillis() - startTime;
                                Instant instant = Instant.ofEpochMilli(duration);
                                LogEvent logEvent = new LogEvent(username, path, method, currentTime, instant);
                                logEventService.createLogEvent(logEvent);
                                userActivityLogger.info(
                                        "User {} authenticated successfully and accessed {} with method {} in {} ms",
                                        username, path, method, duration);
                            } catch (Exception logError) {
                                userActivityLogger.warn("Authenticated {} but failed to persist log event", username, logError);
                            }
                        }
                    }
                } catch (Exception tokenError) {
                    userActivityLogger.warn("Invalid or expired JWT on {} {}: {}", method, path, tokenError.getMessage());
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
