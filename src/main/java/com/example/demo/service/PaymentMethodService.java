package com.example.demo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.demo.dto.PaymentMethodDto;
import com.example.demo.dto.PaymentMethodRequest;
import com.example.demo.model.PaymentMethod;
import com.example.demo.model.User;
import com.example.demo.repository.PaymentMethodRepository;

@Service
public class PaymentMethodService {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Transactional(readOnly = true)
    public List<PaymentMethodDto> listForUser(User user) {
        return paymentMethodRepository.findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentMethod getForUser(Long id, User user) {
        return paymentMethodRepository.findByIdAndUser_IdAndActiveTrue(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Payment method not found."));
    }

    @Transactional(readOnly = true)
    public PaymentMethod resolveForOrder(User user, Long paymentMethodId) {
        if (paymentMethodId != null) {
            return getForUser(paymentMethodId, user);
        }
        return paymentMethodRepository.findByUser_IdAndIsDefaultTrueAndActiveTrue(user.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No payment method selected. Please add or choose a payment method."));
    }

    @Transactional
    public PaymentMethodDto create(User user, PaymentMethodRequest request) {
        validateRequest(request);
        PaymentMethod method = new PaymentMethod();
        method.setUser(user);
        applyRequest(method, request);
        if (Boolean.TRUE.equals(request.getIsDefault()) || paymentMethodRepository
                .findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId()).isEmpty()) {
            clearDefault(user);
            method.setDefault(true);
        }
        return toDto(paymentMethodRepository.save(method));
    }

    @Transactional
    public PaymentMethodDto update(User user, Long id, PaymentMethodRequest request) {
        validateRequest(request);
        PaymentMethod method = getForUser(id, user);
        applyRequest(method, request);
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefault(user);
            method.setDefault(true);
        }
        return toDto(paymentMethodRepository.save(method));
    }

    @Transactional
    public void delete(User user, Long id) {
        PaymentMethod method = getForUser(id, user);
        method.setActive(false);
        method.setDefault(false);
        paymentMethodRepository.save(method);
        List<PaymentMethod> remaining = paymentMethodRepository
                .findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId());
        if (!remaining.isEmpty() && remaining.stream().noneMatch(PaymentMethod::isDefault)) {
            remaining.get(0).setDefault(true);
            paymentMethodRepository.save(remaining.get(0));
        }
    }

    @Transactional
    public PaymentMethodDto setDefault(User user, Long id) {
        PaymentMethod method = getForUser(id, user);
        clearDefault(user);
        method.setDefault(true);
        return toDto(paymentMethodRepository.save(method));
    }

    private void clearDefault(User user) {
        paymentMethodRepository.findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId())
                .forEach(existing -> {
                    if (existing.isDefault()) {
                        existing.setDefault(false);
                        paymentMethodRepository.save(existing);
                    }
                });
    }

    private void validateRequest(PaymentMethodRequest request) {
        if (!StringUtils.hasText(request.getLabel())) {
            throw new IllegalArgumentException("Payment label is required.");
        }
        if (!StringUtils.hasText(request.getCardholderName())) {
            throw new IllegalArgumentException("Cardholder name is required.");
        }
        if (!StringUtils.hasText(request.getCardBrand())) {
            throw new IllegalArgumentException("Card brand is required.");
        }
        if (!StringUtils.hasText(request.getCardNumber()) || request.getCardNumber().replaceAll("\\D", "").length() < 4) {
            throw new IllegalArgumentException("A valid card number is required.");
        }
        if (request.getExpiryMonth() < 1 || request.getExpiryMonth() > 12) {
            throw new IllegalArgumentException("Expiry month must be between 1 and 12.");
        }
        if (request.getExpiryYear() < 2024) {
            throw new IllegalArgumentException("Expiry year is invalid.");
        }
    }

    private void applyRequest(PaymentMethod method, PaymentMethodRequest request) {
        String digits = request.getCardNumber().replaceAll("\\D", "");
        method.setLabel(request.getLabel().trim());
        method.setCardholderName(request.getCardholderName().trim());
        method.setCardBrand(request.getCardBrand().trim());
        method.setCardLastFour(digits.substring(digits.length() - 4));
        method.setExpiryMonth(request.getExpiryMonth());
        method.setExpiryYear(request.getExpiryYear());
    }

    private PaymentMethodDto toDto(PaymentMethod method) {
        return new PaymentMethodDto(
                method.getId(),
                method.getLabel(),
                method.getCardholderName(),
                method.getCardBrand(),
                method.getCardLastFour(),
                method.getExpiryMonth(),
                method.getExpiryYear(),
                method.isDefault());
    }
}
