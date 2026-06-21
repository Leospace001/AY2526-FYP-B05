package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}