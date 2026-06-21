package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.ChatGroup;

public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {

    @Query("""
            SELECT g FROM ChatGroup g
            JOIN FETCH g.createdBy
            WHERE g.id IN (
                SELECT m.group.id FROM ChatGroupMember m
                WHERE m.user.id = :userId AND m.active = true
            )
            ORDER BY g.updatedAt DESC
            """)
    List<ChatGroup> findActiveGroupsForUser(@Param("userId") Long userId);

    @Query("""
            SELECT g FROM ChatGroup g
            JOIN FETCH g.createdBy
            ORDER BY g.updatedAt DESC
            """)
    List<ChatGroup> findAllWithCreator();

    @Query("""
            SELECT g FROM ChatGroup g
            LEFT JOIN FETCH g.createdBy
            WHERE g.id = :groupId
            """)
    Optional<ChatGroup> findByIdWithCreator(@Param("groupId") Long groupId);
}
