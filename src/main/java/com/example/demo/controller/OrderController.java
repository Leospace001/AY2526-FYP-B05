// src/main/java/com/example/demo/controller/OrderController.java
package com.example.demo.controller;

import com.example.demo.dto.OrderItemRequestDto;
import com.example.demo.dto.OrderItemResponse;
import com.example.demo.dto.OrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.mapper.OrderItemMapper;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.OrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderItemMapper orderItemMapper;

    @GetMapping("/page")
    @Operation(summary = "Get all orders with pagination and sorting", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<OrderResponse>> getPaginatedOrders(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(orderService.getPaginatedOrders(page, size, sortBy, sortDir));
    }

    @PostMapping("/checkout")
    @Operation(summary = "checkout the shopping cart", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<OrderResponse> checkoutCart(
        @RequestBody OrderRequest orderRequest,
        Authentication authentication
    ) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        return ResponseEntity.ok(orderService.checkoutCart(user, orderRequest));
    }




    @PostMapping()
    @Operation(summary = "Create an order without order item", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<OrderResponse> createOrder(
        @RequestBody OrderRequest orderRequest,
        Authentication authentication
    ) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        return ResponseEntity.ok(orderService.createOrder(user, orderRequest));
    }

    @PutMapping("{orderId}")
    @Operation(summary = "Update an order without order item", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<OrderResponse> updateOrder(
        @RequestBody OrderRequest orderRequest,
        Authentication authentication,
        @PathVariable Long orderId
    ) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        return ResponseEntity.ok(orderService.update(user, orderId, orderRequest));
    }

    @PostMapping("{orderId}")
    @Operation(summary = "Add item to existing order", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<OrderItemResponse> addItemToOrder(
        @RequestBody OrderItemRequestDto item,
        Authentication authentication,
        @PathVariable Long orderId
    ) {
        // Because we updated the service to accept the DTO, this now works perfectly!
        OrderItem element = orderService.addStockToExistingOrder(orderId, item);
        
        // Maps the saved entity out to your flat, clean response DTO
        return ResponseEntity.ok(orderItemMapper.orderItemToResponse(element));
    }
}
