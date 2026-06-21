package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.NullValueCheckStrategy;

import com.example.demo.dto.OrderItemResponse;
import com.example.demo.model.OrderItem;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface OrderItemMapper {

    // This handles Entity -> Response perfectly
    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "stock.id", target = "stockId")
    @Mapping(source = "stock.name", target = "stockName")
    @Mapping(source = "stock.imagePath", target = "imagePath")
    @Mapping(target = "lineTotal", expression = "java(item.getUnitPrice() * item.getQuantity())")
    OrderItemResponse orderItemToResponse(OrderItem item);
    
}