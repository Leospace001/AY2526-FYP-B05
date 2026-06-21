package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.UserIdentity;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, Long> {
    Optional<UserIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);

    @Query("""
            SELECT ui FROM UserIdentity ui
            JOIN FETCH ui.user u
            WHERE ui.provider = :provider AND ui.providerUserId = :providerUserId
            """)
    Optional<UserIdentity> findByProviderAndProviderUserIdWithUser(
            @Param("provider") String provider,
            @Param("providerUserId") String providerUserId);
}
