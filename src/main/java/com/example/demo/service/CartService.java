package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AddToCartRequest;
import com.example.demo.dto.CartDto;
import com.example.demo.dto.UpdateCartItemRequest;
import com.example.demo.mapper.CartMapper;
import com.example.demo.model.Cart;
import com.example.demo.model.CartItem;
import com.example.demo.model.Stock;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.StockRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartService {

    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private StockRepository stockRepository;
    @Autowired
    private CartMapper cartMapper;
    @Autowired
    private CartItemRepository cartItemRepository;

    @Transactional
    public CartDto getCartByUserId(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> createEmptyCart(userId));
        return toCartDto(cart);
    }

    @Transactional
    public CartDto addToCart(Long userId, AddToCartRequest request) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart == null) {
            cart = createEmptyCart(userId);
        }

        Stock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + request.getStockId()));

        if (!stock.isActive()) {
            throw new RuntimeException("This product is currently unavailable.");
        }

        CartItem existingItem = cartItemRepository
                .findByCart_IdAndStock_Id(cart.getId(), stock.getId())
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .stock(stock)
                    .quantity(request.getQuantity())
                    .cart(cart)
                    .build();
            cartItemRepository.save(newItem);
        }

        return toCartDto(cart);
    }

    private Cart createEmptyCart(Long userId) {
        Cart newCart = Cart.builder()
                .userId(userId)
                .build();
        return cartRepository.save(newCart);
    }

    @Transactional
    public CartDto removeFromCart(Long userId, Long cartItemId) {
        int deleted = cartItemRepository.deleteByIdAndUserId(cartItemId, userId);
        if (deleted == 0) {
            throw new RuntimeException("Item not found in cart with ID: " + cartItemId);
        }
        return toCartDto(cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user ID: " + userId)));
    }

    @Transactional
    public CartDto updateCartItemQuantity(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new RuntimeException("Quantity must be at least 1");
        }

        CartItem item = cartItemRepository.findOwnedByIdAndUserId(cartItemId, userId)
                .orElseThrow(() -> new RuntimeException("Item not found in cart with ID: " + cartItemId));

        Stock stock = item.getStock();
        if (stock.getQuantity() < request.getQuantity()) {
            throw new RuntimeException(
                    "Not enough stock available. Current warehouse stock: " + stock.getQuantity());
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return toCartDto(cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user ID: " + userId)));
    }

    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteAllByCart_UserId(userId);
    }

    private CartDto toCartDto(Cart cart) {
        CartDto dto = cartMapper.cartToCartDto(cart);
        dto.setItems(cartItemRepository.findItemDtosByUserId(cart.getUserId()));
        return dto;
    }
}
