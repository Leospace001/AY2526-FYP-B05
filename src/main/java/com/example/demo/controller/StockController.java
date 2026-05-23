package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.*;
import org.springframework.security.core.Authentication;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
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

    @GetMapping("/")
    @Operation(summary = "Get all stocks", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<StockResponseDto>> getAllStocks() {
        List<StockResponseDto> dto = new ArrayList<>();
        for (Stock item : stockService.findAll()) {
            StockResponseDto elem = stockmapper.StocktoResponseDto(item);
            dto.add(elem);
        }
        return ResponseEntity.ok(dto);
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
}