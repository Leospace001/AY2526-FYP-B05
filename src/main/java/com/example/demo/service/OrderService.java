package com.example.demo.service;

import java.nio.file.Files;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Cart;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Stock;
import com.example.demo.model.User;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.StockRepository;
import com.example.demo.repository.CartRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import com.example.demo.dto.OrderItemRequestDto;
import com.example.demo.dto.OrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.exception.StockNotEnoughException;
import com.example.demo.mapper.OrderItemMapper;
import com.example.demo.mapper.OrderMapper;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderMapper orderMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public Order findById(Long id) {
        Order order = orderRepository.findById(id).orElseThrow();
        return order;
    }

    public Page<OrderResponse> getPaginatedOrders(User user, boolean isAdmin, int page, int size, String sortBy, String sortDir) {
        // 1. Determine the sort direction dynamically
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) 
                    ? Sort.by(sortBy).ascending() 
                    : Sort.by(sortBy).descending();
                    
        // 2. Pass the dynamic sort object to the Pageable request
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // 3. 🚀 SECURE DYNAMIC ACCESS FILTERING
        Page<Order> orderPage;
        if (isAdmin) {
            // Administrators load complete warehouse histories
            orderPage = orderRepository.findAll(pageable);
        } else {
            // Normal authenticated users are restricted strictly to their own rows
            orderPage = orderRepository.findByCreatedBy(user, pageable);
        }
        
        return orderPage.map(order -> orderMapper.orderToOrderResponse(order));
    }

    public OrderResponse createOrder(User user, OrderRequest dto) {
        Order order = orderMapper.orderRequestDtoToOrder(dto);
        order.setCreatedBy(user);
        orderRepository.save(order);
        return orderMapper.orderToOrderResponse(order);
    }

     public OrderResponse update(User user, Long id, OrderRequest dto) {
        Order order = orderRepository.findById(id).orElseThrow();
        orderMapper.updateOrderFromDto(dto, order);
        order.setUpdatedBy(user);
        Order updatedOrder = orderRepository.save(order);
        return orderMapper.orderToOrderResponse(updatedOrder);
    }

    public OrderItem addStockToExistingOrder(Long orderId, OrderItemRequestDto dto) {
        // 1. Fetch the Order from the DB
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        // 2. Fetch the Stock from the DB using the ID from the DTO
        Stock stock = stockRepository.findById(dto.getStockId())
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + dto.getStockId()));

        // 3. Validate stock levels
        if (stock.getQuantity() < dto.getQuantity()) {
            throw new StockNotEnoughException("Not enough stock available. Current stock: " + stock.getQuantity());
        }

        // 4. Create and populate the new OrderItem entity manually
        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);           // Links the Order
        orderItem.setStock(stock); 
        orderItem.setRemarks(dto.getRemarks());          // Links the Stock
        orderItem.setQuantity(dto.getQuantity());

        // 5. Deduct the stock quantity and save the updated stock
        stock.setQuantity(stock.getQuantity() - dto.getQuantity());
        stockRepository.save(stock);

        // 6. Add the item to the order's transactions list
        order.getTransactions().add(orderItem);

        // 7. Save and return the OrderItem
        return orderItemRepository.save(orderItem);
    }

    @Transactional
    public OrderResponse checkoutCart(User user, OrderRequest dto) {
        // 1. Fetch the user's active shopping cart
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("No active shopping cart found for this user"));

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cannot checkout an empty shopping cart");
        }

        // 2. Create and initialize the main Order record (Reusing your existing mapper!)
        Order order = orderMapper.orderRequestDtoToOrder(dto);
        order.setCreatedBy(user);
        Order savedOrder = orderRepository.save(order);

        // 3. Loop through all items in the cart (This is your EXACT old logic, just running in a loop)
        for (com.example.demo.model.CartItem cartItem : cart.getItems()) {
            Stock stock = cartItem.getStock();

            // Validate stock levels using your existing business rule
            if (stock.getQuantity() < cartItem.getQuantity()) {
                throw new StockNotEnoughException("Not enough stock available for item: " 
                        + stock.getId() + ". Current warehouse stock: " + stock.getQuantity());
            }

            // Create and populate the OrderItem record
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setStock(stock);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setRemarks("Purchased via shopping cart");

            // Deduct the stock quantity and save
            stock.setQuantity(stock.getQuantity() - cartItem.getQuantity());
            stockRepository.save(stock);

            // Add item to order transaction log
            orderItemRepository.save(orderItem);
            savedOrder.getTransactions().add(orderItem);
        }

        // 4. Clear the cart contents after a successful checkout
        cart.getItems().clear();
        cartRepository.save(cart);

        // 5. Return the clean response DTO
        return orderMapper.orderToOrderResponse(savedOrder);
    }
}