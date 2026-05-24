package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.Order;
import com.example.demo.model.UserRoleAssignment;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
}