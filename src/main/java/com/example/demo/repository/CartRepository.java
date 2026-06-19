package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.Cart;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);

    /** Loads cart, items, and stock in a single query — used by checkout. */
    @EntityGraph(attributePaths = {"items", "items.stock"})
    @Query("SELECT c FROM Cart c WHERE c.userId = :userId")
    Optional<Cart> findWithItemsAndStockByUserId(@Param("userId") Long userId);
}