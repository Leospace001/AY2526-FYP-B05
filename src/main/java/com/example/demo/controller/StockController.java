package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.service.*;
import org.springframework.http.ResponseEntity;

import com.example.demo.dto.StockResponseDto;
import com.example.demo.mapper.StockMapper;
import com.example.demo.model.Stock;


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
            StockResponseDto elem = stockmapper.StocktoStockDto(item);
            dto.add(elem);
        }
        return ResponseEntity.ok(dto);
    }

    
}