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

import com.example.demo.dto.DeliveryAddressDto;
import com.example.demo.dto.DeliveryAddressRequest;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.DeliveryAddressService;
import com.example.demo.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/addresses")
public class DeliveryAddressController {

    @Autowired
    private DeliveryAddressService deliveryAddressService;

    @Autowired
    private UserService userService;

    @GetMapping
    @Operation(summary = "List saved delivery addresses", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<DeliveryAddressDto>> listAddresses(Authentication authentication) {
        return ResponseEntity.ok(deliveryAddressService.listForUser(getUser(authentication)));
    }

    @PostMapping
    @Operation(summary = "Create a delivery address", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeliveryAddressDto> createAddress(
            @RequestBody DeliveryAddressRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(deliveryAddressService.create(getUser(authentication), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a delivery address", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeliveryAddressDto> updateAddress(
            @PathVariable Long id,
            @RequestBody DeliveryAddressRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(deliveryAddressService.update(getUser(authentication), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a delivery address", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id, Authentication authentication) {
        deliveryAddressService.delete(getUser(authentication), id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Set default delivery address", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeliveryAddressDto> setDefault(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(deliveryAddressService.setDefault(getUser(authentication), id));
    }

    private User getUser(Authentication authentication) {
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        return userService.getUserByUsername(principal.getUsername());
    }
}
