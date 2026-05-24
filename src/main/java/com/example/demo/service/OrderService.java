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

import com.example.demo.dto.OrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.exception.StockNotEnoughException;
import com.example.demo.mapper.OrderMapper;
import com.example.demo.mapper.StockMapper;
import com.example.demo.model.Stock;

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

    public OrderItem addStockToExistingOrder(Long orderId, OrderItem item, int quantity) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        Set<OrderItem> existingItem = order.getTransactions();
        Stock element = stockRepository.findByName(item.getOrder().getName()).get(1);
        if (element == null || element.getQuantity() < item.getQuantity()) {
            throw new StockNotEnoughException("Not enough stock");
        }
        existingItem.add(item);
        element.setQuantity(element.getQuantity() - quantity);
        stockRepository.save(element);
        return orderItemRepository.save(item);
    }
}