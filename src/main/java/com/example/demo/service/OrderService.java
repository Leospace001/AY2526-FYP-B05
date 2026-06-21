package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.OrderItemRequestDto;
import com.example.demo.dto.OrderRequest;
import com.example.demo.dto.OrderResponse;
import com.example.demo.exception.StockNotEnoughException;
import com.example.demo.mapper.OrderItemMapper;
import com.example.demo.mapper.OrderMapper;
import com.example.demo.model.Cart;
import com.example.demo.model.DeliveryAddress;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.PaymentMethod;
import com.example.demo.model.Stock;
import com.example.demo.model.User;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.StockRepository;

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

    @Autowired
    private OrderItemMapper orderItemMapper;

    @Autowired
    private DeliveryAddressService deliveryAddressService;

    @Autowired
    private PaymentMethodService paymentMethodService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public Order findById(Long id) {
        return orderRepository.findById(id).orElseThrow();
    }

    public Page<OrderResponse> getPaginatedOrders(User user, boolean isAdmin, int page, int size, String sortBy,
            String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Order> orderPage = isAdmin
                ? orderRepository.findAll(pageable)
                : orderRepository.findByCreatedBy(user, pageable);

        return orderPage.map(this::toOrderResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(User user, boolean isAdmin, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));
        if (!isAdmin && !order.getCreatedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have access to this order.");
        }
        return toOrderResponse(order);
    }

    public OrderResponse createOrder(User user, OrderRequest dto) {
        Order order = orderMapper.orderRequestDtoToOrder(dto);
        order.setCreatedBy(user);
        if (dto.getDeliveryAddressId() != null || dto.getPaymentMethodId() != null
                || hasSavedFulfillment(user)) {
            applyFulfillmentDetails(order, user, dto);
        }
        orderRepository.save(order);
        return toOrderResponse(order);
    }

    public OrderResponse update(User user, Long id, OrderRequest dto) {
        Order order = orderRepository.findById(id).orElseThrow();
        orderMapper.updateOrderFromDto(dto, order);
        order.setUpdatedBy(user);
        Order updatedOrder = orderRepository.save(order);
        return toOrderResponse(updatedOrder);
    }

    public OrderItem addStockToExistingOrder(Long orderId, OrderItemRequestDto dto) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        Stock stock = stockRepository.findById(dto.getStockId())
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + dto.getStockId()));

        if (stock.getQuantity() < dto.getQuantity()) {
            throw new StockNotEnoughException("Not enough stock available. Current stock: " + stock.getQuantity());
        }

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setStock(stock);
        orderItem.setRemarks(dto.getRemarks());
        orderItem.setQuantity(dto.getQuantity());
        orderItem.setUnitPrice(stock.getSellingPrice());

        stock.setQuantity(stock.getQuantity() - dto.getQuantity());
        stockRepository.save(stock);

        order.getTransactions().add(orderItem);
        order.setOrderTotal(order.getOrderTotal() + (orderItem.getUnitPrice() * orderItem.getQuantity()));
        orderRepository.save(order);

        return orderItemRepository.save(orderItem);
    }

    @Transactional
    public OrderResponse checkoutCart(User user, OrderRequest dto) {
        Cart cart = cartRepository.findWithItemsAndStockByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("No active shopping cart found for this user"));

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cannot checkout an empty shopping cart");
        }

        Order order = orderMapper.orderRequestDtoToOrder(dto);
        order.setCreatedBy(user);
        applyFulfillmentDetails(order, user, dto);
        Order savedOrder = orderRepository.save(order);

        double total = 0;
        for (com.example.demo.model.CartItem cartItem : cart.getItems()) {
            Stock stock = cartItem.getStock();

            if (stock.getQuantity() < cartItem.getQuantity()) {
                throw new StockNotEnoughException("Not enough stock available for item: "
                        + stock.getId() + ". Current warehouse stock: " + stock.getQuantity());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setStock(stock);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(stock.getSellingPrice());
            orderItem.setRemarks("Purchased via shopping cart");

            stock.setQuantity(stock.getQuantity() - cartItem.getQuantity());
            stockRepository.save(stock);

            total += orderItem.getUnitPrice() * orderItem.getQuantity();
            orderItemRepository.save(orderItem);
            savedOrder.getTransactions().add(orderItem);
        }

        savedOrder.setOrderTotal(total);
        orderRepository.save(savedOrder);

        cart.getItems().clear();
        cartRepository.save(cart);

        return toOrderResponse(savedOrder);
    }

    private void applyFulfillmentDetails(Order order, User user, OrderRequest dto) {
        DeliveryAddress address = deliveryAddressService.resolveForCheckout(
                user, dto.getDeliveryAddressId(), dto.getDeliveryAddress(), dto.getSaveDeliveryAddress());
        PaymentMethod payment = paymentMethodService.resolveForCheckout(
                user, dto.getPaymentMethodId(), dto.getPaymentMethod(), dto.getSavePaymentMethod());

        order.setDeliveryAddressId(address.getId());
        order.setDeliveryLabel(address.getLabel());
        order.setDeliveryRecipientName(address.getRecipientName());
        order.setDeliveryPhone(address.getPhone());
        order.setDeliveryAddressLine1(address.getAddressLine1());
        order.setDeliveryAddressLine2(address.getAddressLine2());
        order.setDeliveryCity(address.getCity());
        order.setDeliveryState(address.getState());
        order.setDeliveryPostalCode(address.getPostalCode());
        order.setDeliveryCountry(address.getCountry());

        order.setPaymentMethodId(payment.getId());
        order.setPaymentLabel(payment.getLabel());
        order.setPaymentCardholderName(payment.getCardholderName());
        order.setPaymentCardBrand(payment.getCardBrand());
        order.setPaymentCardLastFour(payment.getCardLastFour());
        order.setPaymentExpiryMonth(payment.getExpiryMonth());
        order.setPaymentExpiryYear(payment.getExpiryYear());
    }

    private OrderResponse toOrderResponse(Order order) {
        OrderResponse response = orderMapper.orderToOrderResponse(order);
        if (order.getCreatedBy() != null) {
            response.setCustomerUsername(order.getCreatedBy().getUsername());
        }
        response.setOrderTotal(order.getOrderTotal());
        response.setDeliveryAddressId(order.getDeliveryAddressId());
        response.setDeliveryLabel(order.getDeliveryLabel());
        response.setDeliveryRecipientName(order.getDeliveryRecipientName());
        response.setDeliveryPhone(order.getDeliveryPhone());
        response.setDeliveryAddressLine1(order.getDeliveryAddressLine1());
        response.setDeliveryAddressLine2(order.getDeliveryAddressLine2());
        response.setDeliveryCity(order.getDeliveryCity());
        response.setDeliveryState(order.getDeliveryState());
        response.setDeliveryPostalCode(order.getDeliveryPostalCode());
        response.setDeliveryCountry(order.getDeliveryCountry());
        response.setPaymentMethodId(order.getPaymentMethodId());
        response.setPaymentLabel(order.getPaymentLabel());
        response.setPaymentCardholderName(order.getPaymentCardholderName());
        response.setPaymentCardBrand(order.getPaymentCardBrand());
        response.setPaymentCardLastFour(order.getPaymentCardLastFour());
        response.setPaymentExpiryMonth(order.getPaymentExpiryMonth());
        response.setPaymentExpiryYear(order.getPaymentExpiryYear());

        List<com.example.demo.dto.OrderItemResponse> items = order.getTransactions() == null
                ? new ArrayList<>()
                : order.getTransactions().stream()
                        .map(orderItemMapper::orderItemToResponse)
                        .collect(Collectors.toList());
        response.setItems(items);
        return response;
    }

    private boolean hasSavedFulfillment(User user) {
        return !deliveryAddressService.listForUser(user).isEmpty()
                && !paymentMethodService.listForUser(user).isEmpty();
    }
}
