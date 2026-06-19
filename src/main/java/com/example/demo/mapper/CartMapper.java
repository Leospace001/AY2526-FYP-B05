package com.example.demo.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.NullValueCheckStrategy;
import com.example.demo.model.Cart;
import com.example.demo.model.CartItem;
import com.example.demo.model.EmailRecord;
import com.example.demo.dto.CartDto;
import com.example.demo.dto.CartItemDto;
import com.example.demo.dto.EmailRequestDto;

@Mapper(componentModel = "spring")
public interface CartMapper {

    CartDto cartToCartDto(Cart cart);

    // This method tells MapStruct exactly how to transition the collections
    List<CartItemDto> cartItemsToCartItemDtos(List<CartItem> items);

    @Mapping(source = "stock.id", target = "stockId")
    @Mapping(source = "stock.name", target = "productName")
    @Mapping(source = "stock.sellingPrice", target = "sellingPrice")
    @Mapping(source = "stock.imagePath", target = "imagePath")
    CartItemDto cartItemToCartItemDto(CartItem cartItem);
}
