package com.example.demo.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.demo.dto.ChatMessageDto;
import com.example.demo.model.ChatGroup;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.User;
import com.example.demo.repository.ChatGroupRepository;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.UserRepository;

@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private ChatGroupService chatGroupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageDto sendMessage(Long groupId, String senderUsername, String content) {
        if (!StringUtils.hasText(content)) {
            throw new IllegalArgumentException("Message cannot be empty.");
        }
        String trimmed = content.trim();
        if (trimmed.length() > 4000) {
            throw new IllegalArgumentException("Message is too long (max 4000 characters).");
        }

        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found."));
        if (!sender.isActive()) {
            throw new IllegalArgumentException("Your account is disabled.");
        }

        chatGroupService.requireActiveMember(groupId, sender);

        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));

        ChatMessage message = new ChatMessage(group, sender, trimmed);
        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageDto dto = toDto(saved);

        messagingTemplate.convertAndSend("/topic/groups/" + groupId, dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getMessages(Long groupId, User requester, int page, int size) {
        if (!chatGroupService.canViewGroup(groupId, requester)) {
            throw new IllegalArgumentException("You do not have access to this group's messages.");
        }

        Page<ChatMessage> messagePage = chatMessageRepository.findByGroupIdOrderBySentAtDesc(
                groupId, PageRequest.of(page, size));

        List<ChatMessageDto> content = messagePage.getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        Collections.reverse(content);

        return new PageImpl<>(content, messagePage.getPageable(), messagePage.getTotalElements());
    }

    private ChatMessageDto toDto(ChatMessage message) {
        User sender = message.getSender();
        String senderName = sender.getFirstname() + " " + sender.getLastname();
        return new ChatMessageDto(
                message.getId(),
                message.getGroup().getId(),
                sender.getId(),
                sender.getUsername(),
                senderName.trim(),
                message.getContent(),
                message.getSentAt());
    }
}
