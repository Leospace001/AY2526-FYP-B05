package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import com.example.demo.service.*;
import org.springframework.http.*;
import com.example.demo.model.*;
import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.mapper.StockMapper;
import com.example.demo.security.CustomUserDetails;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    @Autowired
    private StockService stockService;

    @Autowired
    private StockMapper stockmapper;

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    @GetMapping("/")
    @Operation(summary = "Get all stocks with pagination and sorting", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<StockResponseDto>> getAllStocks(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size, 
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            Authentication authentication) {
        
        Page<StockResponseDto> paginatedStocks = stockService.getPaginatedStocks(
                search, page, size, sortBy, sortDir, isAdmin(authentication));
        return ResponseEntity.ok(paginatedStocks);
    }

    @PostMapping(value = "/", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "add stock", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<StockResponseDto> addStock(
            @Parameter(required = false) @ModelAttribute StockRequestDto dto,
            Authentication authentication) {
        List<Stock> existingStock = stockService.findByName(dto.getName());
        if (!existingStock.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();

        try {
            StockResponseDto respDto = stockService.addStock(dto, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(respDto); // Returns 201 Created status
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // Returns 500 instead of 200
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "update an existing stock item", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<StockResponseDto> updateStock(
            @PathVariable Long id,
            @Parameter(required = false) @ModelAttribute StockRequestDto dto,
            Authentication authentication) {
        
        // 1. Unique Name Validation: Ensure name doesn't conflict with a different product id
        List<Stock> existingStock = stockService.findByName(dto.getName());
        if (!existingStock.isEmpty() && !existingStock.get(0).getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build(); // 400 Bad Request on name collision
        }

        // 2. Extract active authenticated User Context
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();

        try {
            // 3. Process field modifications
            StockResponseDto updatedDto = stockService.updateStock(id, dto, user);
            return ResponseEntity.ok(updatedDto); // Returns 200 OK with refreshed object details
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // Returns 500 on system crashes
        }
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Set whether a product is visible in the catalog", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<StockResponseDto> setAvailability(
            @PathVariable Long id,
            @RequestParam boolean active) {
        try {
            return ResponseEntity.ok(stockService.setAvailability(id, active));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}