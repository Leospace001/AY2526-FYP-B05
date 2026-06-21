package com.example.demo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.demo.dto.DeliveryAddressDto;
import com.example.demo.dto.DeliveryAddressRequest;
import com.example.demo.model.DeliveryAddress;
import com.example.demo.model.User;
import com.example.demo.repository.DeliveryAddressRepository;

@Service
public class DeliveryAddressService {

    @Autowired
    private DeliveryAddressRepository deliveryAddressRepository;

    @Transactional(readOnly = true)
    public List<DeliveryAddressDto> listForUser(User user) {
        return deliveryAddressRepository.findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeliveryAddress getForUser(Long id, User user) {
        return deliveryAddressRepository.findByIdAndUser_IdAndActiveTrue(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Delivery address not found."));
    }

    @Transactional(readOnly = true)
    public DeliveryAddress resolveForOrder(User user, Long addressId) {
        if (addressId != null) {
            return getForUser(addressId, user);
        }
        return deliveryAddressRepository.findByUser_IdAndIsDefaultTrueAndActiveTrue(user.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No delivery address selected. Please add or choose a delivery address."));
    }

    @Transactional
    public DeliveryAddressDto create(User user, DeliveryAddressRequest request) {
        validateRequest(request);
        DeliveryAddress address = new DeliveryAddress();
        address.setUser(user);
        applyRequest(address, request);
        if (Boolean.TRUE.equals(request.getIsDefault()) || deliveryAddressRepository
                .findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId()).isEmpty()) {
            clearDefault(user);
            address.setDefault(true);
        }
        return toDto(deliveryAddressRepository.save(address));
    }

    @Transactional
    public DeliveryAddressDto update(User user, Long id, DeliveryAddressRequest request) {
        validateRequest(request);
        DeliveryAddress address = getForUser(id, user);
        applyRequest(address, request);
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefault(user);
            address.setDefault(true);
        }
        return toDto(deliveryAddressRepository.save(address));
    }

    @Transactional
    public void delete(User user, Long id) {
        DeliveryAddress address = getForUser(id, user);
        address.setActive(false);
        address.setDefault(false);
        deliveryAddressRepository.save(address);
        if (!deliveryAddressRepository.findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId()).isEmpty()) {
            List<DeliveryAddress> remaining = deliveryAddressRepository
                    .findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId());
            if (remaining.stream().noneMatch(DeliveryAddress::isDefault)) {
                remaining.get(0).setDefault(true);
                deliveryAddressRepository.save(remaining.get(0));
            }
        }
    }

    @Transactional
    public DeliveryAddressDto setDefault(User user, Long id) {
        DeliveryAddress address = getForUser(id, user);
        clearDefault(user);
        address.setDefault(true);
        return toDto(deliveryAddressRepository.save(address));
    }

    private void clearDefault(User user) {
        deliveryAddressRepository.findByUser_IdAndActiveTrueOrderByIsDefaultDescLabelAsc(user.getId())
                .forEach(existing -> {
                    if (existing.isDefault()) {
                        existing.setDefault(false);
                        deliveryAddressRepository.save(existing);
                    }
                });
    }

    private void validateRequest(DeliveryAddressRequest request) {
        if (!StringUtils.hasText(request.getLabel())) {
            throw new IllegalArgumentException("Address label is required.");
        }
        if (!StringUtils.hasText(request.getRecipientName())) {
            throw new IllegalArgumentException("Recipient name is required.");
        }
        if (!StringUtils.hasText(request.getAddressLine1())) {
            throw new IllegalArgumentException("Address line 1 is required.");
        }
        if (!StringUtils.hasText(request.getCity())) {
            throw new IllegalArgumentException("City is required.");
        }
        if (!StringUtils.hasText(request.getPostalCode())) {
            throw new IllegalArgumentException("Postal code is required.");
        }
        if (!StringUtils.hasText(request.getCountry())) {
            throw new IllegalArgumentException("Country is required.");
        }
    }

    private void applyRequest(DeliveryAddress address, DeliveryAddressRequest request) {
        address.setLabel(request.getLabel().trim());
        address.setRecipientName(request.getRecipientName().trim());
        address.setPhone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null);
        address.setAddressLine1(request.getAddressLine1().trim());
        address.setAddressLine2(StringUtils.hasText(request.getAddressLine2()) ? request.getAddressLine2().trim() : null);
        address.setCity(request.getCity().trim());
        address.setState(StringUtils.hasText(request.getState()) ? request.getState().trim() : null);
        address.setPostalCode(request.getPostalCode().trim());
        address.setCountry(request.getCountry().trim());
    }

    private DeliveryAddressDto toDto(DeliveryAddress address) {
        return new DeliveryAddressDto(
                address.getId(),
                address.getLabel(),
                address.getRecipientName(),
                address.getPhone(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                address.isDefault());
    }
}
