package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.NullValueCheckStrategy;
import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.model.Stock;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface StockMapper {
    
    Stock stockDtoToStock(StockResponseDto stockDto);

    @Mapping(source = "active", target = "active")
    StockResponseDto StocktoResponseDto(Stock stock);

    @Mapping(target = "imagePath", ignore = true)
    @Mapping(target = "active", ignore = true)
    Stock stockRequestDtoToStock(StockRequestDto stockDto);

    @Mapping(target = "imagePath", ignore = true)
    void updateStockFromDto(StockRequestDto dto, @MappingTarget Stock stock);
}