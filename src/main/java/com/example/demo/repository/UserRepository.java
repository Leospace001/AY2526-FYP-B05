package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = { "roleAssignments", "roleAssignments.role" })
    Optional<User> findWithRolesById(Long id);

    @EntityGraph(attributePaths = { "roleAssignments", "roleAssignments.role" })
    Optional<User> findWithRolesByUsername(String username);

    @EntityGraph(attributePaths = { "roleAssignments", "roleAssignments.role" })
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findWithRolesByEmailIgnoreCase(@Param("email") String email);

    @Query("""
            SELECT u FROM User u
            WHERE u.active = true
            AND u.id NOT IN (
                SELECT m.user.id FROM ChatGroupMember m
                WHERE m.group.id = :groupId AND m.active = true
            )
            AND (
                LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.firstname) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(u.lastname) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(CONCAT(u.firstname, ' ', u.lastname)) LIKE LOWER(CONCAT('%', :query, '%'))
            )
            ORDER BY u.username ASC
            """)
    List<User> searchInviteCandidates(
            @Param("groupId") Long groupId,
            @Param("query") String query,
            Pageable pageable);
}