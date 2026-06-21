package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.PaymentMethodDto;
import com.example.demo.dto.PaymentMethodRequest;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.PaymentMethodService;
import com.example.demo.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    @Autowired
    private PaymentMethodService paymentMethodService;

    @Autowired
    private UserService userService;

    @GetMapping
    @Operation(summary = "List saved payment methods", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<PaymentMethodDto>> listPaymentMethods(Authentication authentication) {
        return ResponseEntity.ok(paymentMethodService.listForUser(getUser(authentication)));
    }

    @PostMapping
    @Operation(summary = "Create a payment method", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentMethodDto> createPaymentMethod(
            @RequestBody PaymentMethodRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(paymentMethodService.create(getUser(authentication), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a payment method", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentMethodDto> updatePaymentMethod(
            @PathVariable Long id,
            @RequestBody PaymentMethodRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(paymentMethodService.update(getUser(authentication), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a payment method", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deletePaymentMethod(@PathVariable Long id, Authentication authentication) {
        paymentMethodService.delete(getUser(authentication), id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Set default payment method", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PaymentMethodDto> setDefault(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(paymentMethodService.setDefault(getUser(authentication), id));
    }

    private User getUser(Authentication authentication) {
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        return userService.getUserByUsername(principal.getUsername());
    }
}
