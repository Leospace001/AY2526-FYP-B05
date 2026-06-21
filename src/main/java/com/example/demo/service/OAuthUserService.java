package com.example.demo.service;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.demo.model.ERole;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.model.UserIdentity;
import com.example.demo.model.UserRoleAssignment;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserIdentityRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.CustomUserDetails;

@Service
public class OAuthUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserIdentityRepository userIdentityRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public CustomUserDetails resolveOAuthLogin(String provider, OAuth2User oauth2User) {
        User user = resolveOAuthUser(provider, oauth2User);
        User loadedUser = userRepository.findWithRolesById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found after OAuth sign-in."));
        return new CustomUserDetails(loadedUser);
    }

    private User resolveOAuthUser(String provider, OAuth2User oauth2User) {
        String providerUserId = extractProviderUserId(provider, oauth2User);
        String email = extractEmail(provider, oauth2User);
        String displayName = extractDisplayName(provider, oauth2User);

        Optional<UserIdentity> existingIdentity = userIdentityRepository
                .findByProviderAndProviderUserIdWithUser(provider, providerUserId);
        if (existingIdentity.isPresent()) {
            return existingIdentity.get().getUser();
        }

        if (StringUtils.hasText(email)) {
            Optional<User> existingUser = userRepository.findWithRolesByEmailIgnoreCase(email);
            if (existingUser.isPresent()) {
                User linkedUser = existingUser.get();
                userIdentityRepository.save(new UserIdentity(linkedUser, provider, providerUserId, email));
                return linkedUser;
            }
        }

        return createOAuthUser(provider, providerUserId, email, displayName);
    }

    private User createOAuthUser(String provider, String providerUserId, String email, String displayName) {
        User user = new User();
        user.setFirstname(extractFirstName(displayName));
        user.setLastname(extractLastName(displayName));
        user.setEmail(StringUtils.hasText(email) ? email : provider + "_" + providerUserId + "@oauth.local");
        user.setUsername(generateUniqueUsername(provider, email, providerUserId));
        // OAuth-only accounts cannot use password login until they set one via reset flow
        user.setPassword(passwordEncoder.encode("oauth-" + UUID.randomUUID()));
        user.setActive(true);

        Role defaultRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default role ROLE_USER not found in database."));
        user.getRoleAssignments().add(new UserRoleAssignment(user, defaultRole));

        User savedUser = userRepository.save(user);
        userIdentityRepository.save(new UserIdentity(savedUser, provider, providerUserId, email));
        return savedUser;
    }

    private String extractProviderUserId(String provider, OAuth2User oauth2User) {
        if (oauth2User instanceof OidcUser oidcUser && StringUtils.hasText(oidcUser.getSubject())) {
            return oidcUser.getSubject();
        }
        if ("github".equals(provider)) {
            Object id = oauth2User.getAttributes().get("id");
            return id != null ? String.valueOf(id) : oauth2User.getName();
        }
        return oauth2User.getName();
    }

    private String extractEmail(String provider, OAuth2User oauth2User) {
        if (oauth2User instanceof OidcUser oidcUser && StringUtils.hasText(oidcUser.getEmail())) {
            return oidcUser.getEmail().trim().toLowerCase(Locale.ROOT);
        }

        Map<String, Object> attributes = oauth2User.getAttributes();
        Object email = attributes.get("email");
        if (email != null && StringUtils.hasText(email.toString())) {
            return email.toString().trim().toLowerCase(Locale.ROOT);
        }

        if ("github".equals(provider)) {
            Object login = attributes.get("login");
            if (login != null) {
                return login + "@users.noreply.github.com";
            }
        }
        return null;
    }

    private String extractDisplayName(String provider, OAuth2User oauth2User) {
        if (oauth2User instanceof OidcUser oidcUser) {
            if (StringUtils.hasText(oidcUser.getFullName())) {
                return oidcUser.getFullName().trim();
            }
            if (StringUtils.hasText(oidcUser.getGivenName())) {
                return oidcUser.getGivenName().trim();
            }
        }

        Map<String, Object> attributes = oauth2User.getAttributes();
        Object name = attributes.get("name");
        if (name != null && StringUtils.hasText(name.toString())) {
            return name.toString().trim();
        }
        if ("github".equals(provider)) {
            Object login = attributes.get("login");
            if (login != null) {
                return login.toString();
            }
        }
        Object givenName = attributes.get("given_name");
        if (givenName != null) {
            return givenName.toString();
        }
        return "OAuth User";
    }

    private String extractFirstName(String displayName) {
        if (!StringUtils.hasText(displayName)) {
            return "OAuth";
        }
        String[] parts = displayName.trim().split("\\s+", 2);
        return parts[0];
    }

    private String extractLastName(String displayName) {
        if (!StringUtils.hasText(displayName)) {
            return "User";
        }
        String[] parts = displayName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "User";
    }

    private String generateUniqueUsername(String provider, String email, String providerUserId) {
        String base;
        if (StringUtils.hasText(email) && email.contains("@")) {
            base = email.substring(0, email.indexOf('@'));
        } else {
            base = provider + "_" + providerUserId;
        }

        base = base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_]", "");
        if (base.length() < 3) {
            base = (provider + providerUserId).replaceAll("[^a-z0-9_]", "");
        }
        if (base.length() < 3) {
            base = "user" + UUID.randomUUID().toString().substring(0, 6);
        }

        String candidate = base;
        int suffix = 1;
        while (userRepository.findByUsername(candidate).isPresent()) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }
}
