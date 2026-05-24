package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.AddToCartRequest;
import com.example.demo.dto.CartDto;
import com.example.demo.dto.CartItemDto;
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
    private StockRepository stockRepository; // USE YOUR STOCK REPOSITORY
    @Autowired
    private CartMapper cartMapper;
    @Autowired
    private CartItemRepository cartItemRepository;

    @Transactional
    public CartDto getCartByUserId(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart == null) {
            cart = createEmptyCart(userId);
        }
        
        // 1. Map the top-level Cart properties (id, userId) using MapStruct
        CartDto dto = cartMapper.cartToCartDto(cart);
        
        // 2. Explicitly attach the manually mapped items list
        dto.setItems(manualMapCartItems(cart.getItems()));
        
        return dto;
    }

    @Transactional
    public CartDto addToCart(Long userId, AddToCartRequest request) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart == null) {
            cart = createEmptyCart(userId);
        }

        Stock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + request.getStockId()));

        CartItem existingItem = null;
        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                if (item.getStock() != null && item.getStock().getId().equals(stock.getId())) {
                    existingItem = item;
                    break;
                }
            }
        }

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
            cart.addItem(newItem); 
        }

        Cart savedCart = cartRepository.saveAndFlush(cart);
        
        // 1. Map top level fields using MapStruct
        CartDto dto = cartMapper.cartToCartDto(savedCart);
        
        // 2. Explicitly force-map the items list to guarantee it populates
        dto.setItems(manualMapCartItems(savedCart.getItems()));
        
        return dto;
    }
    
    private Cart createEmptyCart(Long userId) {
        Cart newCart = Cart.builder()
                .userId(userId)
                .build();
        return cartRepository.save(newCart);
    }

    private List<CartItemDto> manualMapCartItems(List<CartItem> items) {
        List<CartItemDto> dtos = new ArrayList<>();
        
        if (items != null) {
            for (CartItem item : items) {
                CartItemDto itemDto = new CartItemDto();
                itemDto.setId(item.getId());
                itemDto.setQuantity(item.getQuantity());
                
                // Safely grab the nested Stock details from your entity
                if (item.getStock() != null) {
                    itemDto.setStockId(item.getStock().getId());
                    itemDto.setSellingPrice(item.getStock().getSellingPrice());
                    itemDto.setImagePath(item.getStock().getImagePath());
                }
                
                dtos.add(itemDto);
            }
        }
        return dtos;
    }

    @Transactional
    public CartDto removeFromCart(Long userId, Long cartItemId) {
        // 1. Find the user's cart
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user ID: " + userId));

        // 2. Search for the specific item to remove inside the cart
        CartItem itemToRemove = null;
        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                if (item.getId() != null && item.getId().equals(cartItemId)) {
                    itemToRemove = item;
                    break;
                }
            }
        }

        // 3. If found, decouple the item from the cart and remove it
        if (itemToRemove != null) {
            cart.removeItem(itemToRemove); 
            // Note: If you don't have the removeItem helper in Cart.java, use these 2 lines instead:
            // cart.getItems().remove(itemToRemove);
            // itemToRemove.setCart(null);
        } else {
            throw new RuntimeException("Item not found in cart with ID: " + cartItemId);
        }

        // 4. Save updates and return the modified cart DTO
        Cart savedCart = cartRepository.save(cart);
        return cartMapper.cartToCartDto(savedCart);
    }

    @Transactional
    public void clearCart(Long userId) {
        // 1. Find the cart
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        
        // 2. If it exists and has items, empty the collection
        if (cart != null && cart.getItems() != null) {
            cart.getItems().clear();
            cartRepository.save(cart);
        }
    }
}