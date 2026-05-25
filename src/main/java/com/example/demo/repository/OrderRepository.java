package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.Order;
import com.example.demo.model.User;
import com.example.demo.model.UserRoleAssignment;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByCreatedBy(User createdBy, Pageable pageable);
    
}