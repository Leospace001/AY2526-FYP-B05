package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.DeliveryAddress;

public interface DeliveryAddressRepository extends JpaRepository<DeliveryAddress, Long> {
    List<DeliveryAddress> findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(Long userId);

    Optional<DeliveryAddress> findByIdAndUser_IdAndActiveTrue(Long id, Long userId);

    Optional<DeliveryAddress> findByUser_IdAndIsDefaultTrueAndActiveTrue(Long userId);
}
