package com.example.demo.service;

import com.example.demo.dto.FlowerCollectionAddRequest;
import com.example.demo.dto.FlowerCollectionResponse;
import com.example.demo.model.FlowerCollection;
import com.example.demo.model.User;
import com.example.demo.repository.FlowerCollectionRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FlowerCollectionService {

    private final FlowerCollectionRepository flowerCollectionRepository;
    private final UserRepository userRepository;

    public FlowerCollectionService(FlowerCollectionRepository flowerCollectionRepository, UserRepository userRepository) {
        this.flowerCollectionRepository = flowerCollectionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FlowerCollectionResponse addCollection(FlowerCollectionAddRequest request) {
        User user = getAuthenticatedUser();

        FlowerCollection collection = new FlowerCollection();
        collection.setUser(user);
        collection.setFlowerName(request.getFlowerName().trim());
        collection.setScientificName(normalizeOptional(request.getScientificName()));
        collection.setCareInstructionsSummary(normalizeOptional(request.getCareInstructionsSummary()));
        collection.setCollectedAt(OffsetDateTime.now());

        FlowerCollection saved = flowerCollectionRepository.save(collection);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FlowerCollectionResponse> getCollectionsForCurrentUser() {
        User user = getAuthenticatedUser();
        return flowerCollectionRepository.findByUserOrderByCollectedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteCollection(UUID id) {
        User user = getAuthenticatedUser();
        FlowerCollection collection = flowerCollectionRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Collection item not found."));

        if (!collection.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You do not own this collection item.");
        }

        flowerCollectionRepository.delete(collection);
    }

    private FlowerCollectionResponse toResponse(FlowerCollection collection) {
        return new FlowerCollectionResponse(
                collection.getId(),
                collection.getFlowerName(),
                collection.getScientificName(),
                collection.getCollectedAt(),
                collection.getCareInstructionsSummary()
        );
    }

    private User getAuthenticatedUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found."));
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
