package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.Order;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
}