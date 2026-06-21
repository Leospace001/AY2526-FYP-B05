package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.ChatGroupMember;
import com.example.demo.model.GroupMemberRole;

public interface ChatGroupMemberRepository extends JpaRepository<ChatGroupMember, Long> {

    @Query("""
            SELECT m FROM ChatGroupMember m
            JOIN FETCH m.user
            WHERE m.group.id = :groupId AND m.active = true
            ORDER BY m.role ASC, m.joinedAt ASC
            """)
    List<ChatGroupMember> findActiveMembersByGroupId(@Param("groupId") Long groupId);

    Optional<ChatGroupMember> findByGroup_IdAndUser_Id(Long groupId, Long userId);

    @Query("""
            SELECT COUNT(m) FROM ChatGroupMember m
            WHERE m.group.id = :groupId AND m.role = :role AND m.active = true
            """)
    long countActiveByGroupIdAndRole(@Param("groupId") Long groupId, @Param("role") GroupMemberRole role);

    @Query("""
            SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
            FROM ChatGroupMember m
            WHERE m.group.id = :groupId AND m.user.id = :userId AND m.active = true
            """)
    boolean isActiveMember(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Query("""
            SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
            FROM ChatGroupMember m
            WHERE m.group.id = :groupId AND m.user.id = :userId
                AND m.role = com.example.demo.model.GroupMemberRole.LEADER AND m.active = true
            """)
    boolean isActiveLeader(@Param("groupId") Long groupId, @Param("userId") Long userId);
}
