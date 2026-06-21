package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.PaymentMethod;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(Long userId);

    Optional<PaymentMethod> findByIdAndUser_IdAndActiveTrue(Long id, Long userId);

    Optional<PaymentMethod> findByUser_IdAndIsDefaultTrueAndActiveTrue(Long userId);
}
