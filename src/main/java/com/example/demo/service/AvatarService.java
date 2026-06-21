package com.example.demo.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

@Service
public class AvatarService {

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public User storeUploadedAvatar(User user, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return user;
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Avatar must be an image file.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Avatar image must be 5 MB or smaller.");
        }

        try {
            deleteStoredAvatarFile(user.getAvatarPath());

            String extension = resolveExtension(file.getOriginalFilename(), contentType);
            String fileName = "avatar-" + user.getId() + "-" + UUID.randomUUID() + extension;
            Path targetPath = Paths.get(uploadDir).resolve(fileName);
            Files.createDirectories(targetPath.getParent());
            file.transferTo(targetPath.toFile());

            user.setAvatarPath(fileName);
            user.setAvatarUrl(null);
            return userRepository.save(user);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store avatar image.", ex);
        }
    }

    public void applyOAuthAvatar(User user, String avatarUrl) {
        if (!StringUtils.hasText(avatarUrl) || StringUtils.hasText(user.getAvatarPath())) {
            return;
        }
        user.setAvatarUrl(avatarUrl.trim());
        userRepository.save(user);
    }

    private void deleteStoredAvatarFile(String avatarPath) {
        if (!StringUtils.hasText(avatarPath)) {
            return;
        }
        try {
            String fileName = avatarPath.contains("/")
                    ? avatarPath.substring(avatarPath.lastIndexOf('/') + 1)
                    : avatarPath;
            Path existing = Paths.get(uploadDir).resolve(fileName);
            Files.deleteIfExists(existing);
        } catch (IOException ignored) {
            // Best-effort cleanup when replacing an avatar.
        }
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (StringUtils.hasText(originalFilename) && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
