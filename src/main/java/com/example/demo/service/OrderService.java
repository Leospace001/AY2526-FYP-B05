package com.example.demo.service;

import java.nio.file.Files;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Stock;
import com.example.demo.model.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Paths;
import java.nio.file.Path;

import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.StockRepository;
import org.springframework.beans.factory.annotation.Value;

import com.example.demo.dto.OrderItemRequestDto;
import com.example.demo.dto.OrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.exception.StockNotEnoughException;
import com.example.demo.mapper.OrderItemMapper;
import com.example.demo.mapper.OrderMapper;
import com.example.demo.mapper.StockMapper;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private OrderItemMapper orderItemMapper;

    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Value("${file.upload-dir}")
    private String uploadDir;

    public Order findById(Long id) {
        Order order = orderRepository.findById(id).orElseThrow();
        return order;
    }

    public List<Order> findAll() {
        List<Order> ordes = orderRepository.findAll();
        return ordes;
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
}