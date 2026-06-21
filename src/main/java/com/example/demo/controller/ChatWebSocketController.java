package com.example.demo.controller;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import com.example.demo.dto.ChatMessageDto;
import com.example.demo.dto.SendChatMessageRequest;
import com.example.demo.security.CustomUserDetails;

@Controller
public class ChatWebSocketController {

    @Autowired
    private com.example.demo.service.ChatMessageService chatMessageService;

    @MessageMapping("/groups/{groupId}/send")
    public void sendMessage(
            @DestinationVariable Long groupId,
            @Payload SendChatMessageRequest request,
            Principal principal) {
        CustomUserDetails userDetails = (CustomUserDetails) ((org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal).getPrincipal();
        chatMessageService.sendMessage(groupId, userDetails.getUsername(), request.getContent());
    }
}
