package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.AddToCartRequest;
import com.example.demo.dto.CartDto;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.CartService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    @Autowired
    private CartService cartService;

    // Helper method to extract User ID from Spring Security Context
    // You will need to implement this based on how you set up your JwtRequestFilter!
    @GetMapping
    @Operation(summary = "Get current user's active shopping cart")
    public ResponseEntity<CartDto> getMyCart(
        Authentication authentication
    ) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        Long userId = user.getId();
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item to the shopping cart")
    public ResponseEntity<CartDto> addItemToCart(
        @RequestBody AddToCartRequest request,
        Authentication authentication
    ) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        Long userId = user.getId();
        return ResponseEntity.ok(cartService.addToCart(userId, request));
    }

    @DeleteMapping("/items/{cartItemId}")
    @Operation(summary = "Remove a specific item from the cart")
    public ResponseEntity<CartDto> removeItemFromCart(
        @PathVariable Long cartItemId,
        Authentication authentication
    ) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        Long userId = user.getId();
        return ResponseEntity.ok(cartService.removeFromCart(userId, cartItemId));
    }

    @DeleteMapping("{userId}")
    @Operation(summary = "Clear the entire shopping cart")
    public ResponseEntity<Void> clearMyCart(
        Authentication authentication,
        @PathVariable Long orderId
    ) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        Long userId = user.getId();
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}