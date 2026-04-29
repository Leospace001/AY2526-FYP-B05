package com.example.demo.controller;

import com.example.demo.dto.FlowerCollectionAddRequest;
import com.example.demo.dto.FlowerCollectionResponse;
import com.example.demo.service.FlowerCollectionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/collection")
public class CollectionController {

    private final FlowerCollectionService flowerCollectionService;

    public CollectionController(FlowerCollectionService flowerCollectionService) {
        this.flowerCollectionService = flowerCollectionService;
    }

    @PostMapping("/add")
    public ResponseEntity<?> addCollection(@Valid @RequestBody FlowerCollectionAddRequest request) {
        try {
            FlowerCollectionResponse response = flowerCollectionService.addCollection(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<FlowerCollectionResponse>> getCollections() {
        return ResponseEntity.ok(flowerCollectionService.getCollectionsForCurrentUser());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCollection(@PathVariable UUID id) {
        try {
            flowerCollectionService.deleteCollection(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }
}
