package com.example.demo.config;

import java.security.Principal;
import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.ChatGroupService;
import com.example.demo.service.CustomUserDetailsService;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final ChatGroupService chatGroupService;
    private final UserRepository userRepository;

    public WebSocketAuthChannelInterceptor(
            JwtUtil jwtUtil,
            CustomUserDetailsService userDetailsService,
            ChatGroupService chatGroupService,
            UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.chatGroupService = chatGroupService;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = resolveToken(accessor);
            if (!StringUtils.hasText(token)) {
                throw new IllegalArgumentException("Missing authentication token.");
            }
            if (jwtUtil.isTokenExpired(token)) {
                throw new IllegalArgumentException("Token expired.");
            }

            String username = jwtUtil.extractUsername(token);
            CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
            if (!jwtUtil.validateToken(token, userDetails)) {
                throw new IllegalArgumentException("Invalid token.");
            }
            if (!userDetails.isEnabled()) {
                throw new IllegalArgumentException("Account is disabled.");
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accessor.setUser(authentication);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Principal user = accessor.getUser();
            if (user == null) {
                throw new IllegalArgumentException("Unauthorized WebSocket subscription.");
            }
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/topic/groups/")) {
                Long groupId = parseGroupId(destination);
                CustomUserDetails principal = (CustomUserDetails) ((UsernamePasswordAuthenticationToken) user).getPrincipal();
                User requester = userRepository.findById(principal.getId())
                        .orElseThrow(() -> new IllegalArgumentException("User not found."));
                if (!chatGroupService.canViewGroup(groupId, requester)) {
                    throw new IllegalArgumentException("You do not have access to this group.");
                }
            }
        }

        return message;
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        List<String> authorization = accessor.getNativeHeader("Authorization");
        if (authorization == null || authorization.isEmpty()) {
            return null;
        }
        String value = authorization.get(0);
        if (value.startsWith("Bearer ")) {
            return value.substring(7);
        }
        return value;
    }

    private Long parseGroupId(String destination) {
        String[] parts = destination.split("/");
        if (parts.length < 4) {
            throw new IllegalArgumentException("Invalid group topic.");
        }
        return Long.parseLong(parts[3]);
    }
}
