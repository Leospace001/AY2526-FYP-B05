package com.example.demo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
            SELECT m FROM ChatMessage m
            JOIN FETCH m.sender
            WHERE m.group.id = :groupId
            ORDER BY m.sentAt DESC
            """)
    Page<ChatMessage> findByGroupIdOrderBySentAtDesc(@Param("groupId") Long groupId, Pageable pageable);
}
