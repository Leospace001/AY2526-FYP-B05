package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.dto.CartItemDto;
import com.example.demo.model.CartItem;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("""
        SELECT new com.example.demo.dto.CartItemDto(
            ci.id, ci.quantity, s.id, s.sellingPrice, s.imagePath)
        FROM CartItem ci
        JOIN ci.cart c
        JOIN ci.stock s
        WHERE c.userId = :userId
        """)
    List<CartItemDto> findItemDtosByUserId(@Param("userId") Long userId);

    Optional<CartItem> findByCart_IdAndStock_Id(Long cartId, Long stockId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
        DELETE FROM cart_items ci
        USING carts c
        WHERE ci.cart_id = c.id
          AND ci.id = :id
          AND c.user_id = :userId
        """, nativeQuery = true)
    int deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
        DELETE FROM cart_items ci
        USING carts c
        WHERE ci.cart_id = c.id
          AND c.user_id = :userId
        """, nativeQuery = true)
    void deleteAllByCart_UserId(@Param("userId") Long userId);
}
